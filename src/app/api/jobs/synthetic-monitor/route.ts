import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { reportError } from "@/lib/observability";
import { validateCronSecret } from "@/lib/cron-auth";
import { getRequestId, recordOperationalEvent } from "@/lib/ops-events";

type SyntheticCheck = {
  name: "health" | "booking_public" | "dashboard_guard" | "canonical_redirect" | "login";
  ok: boolean;
  statusCode?: number;
  latencyMs: number;
  details?: string;
};

function getMonitorSecret(): string | undefined {
  return process.env.SYNTHETIC_MONITOR_SECRET?.trim() || process.env.REMINDERS_CRON_SECRET?.trim() || undefined;
}

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://ocupaloc.ro").replace(/\/$/, "");
}

function getBookingSlug() {
  return process.env.SYNTHETIC_BOOKING_SLUG?.trim() || process.env.PLAYWRIGHT_BOOKING_SLUG?.trim() || "ana-nails";
}

async function timedFetch(url: string, init?: RequestInit): Promise<{ status: number; latencyMs: number; location?: string }> {
  const startedAt = Date.now();
  const response = await fetch(url, { ...init, redirect: "manual", cache: "no-store" });
  return {
    status: response.status,
    latencyMs: Date.now() - startedAt,
    location: response.headers.get("location") ?? undefined
  };
}

async function checkHealth(baseUrl: string): Promise<SyntheticCheck> {
  const r = await timedFetch(`${baseUrl}/api/health`);
  return { name: "health", ok: r.status === 200, statusCode: r.status, latencyMs: r.latencyMs };
}

async function checkPublicBooking(baseUrl: string, slug: string): Promise<SyntheticCheck> {
  const r = await timedFetch(`${baseUrl}/${slug}`);
  return { name: "booking_public", ok: r.status === 200, statusCode: r.status, latencyMs: r.latencyMs };
}

async function checkDashboardGuard(baseUrl: string): Promise<SyntheticCheck> {
  const r = await timedFetch(`${baseUrl}/dashboard`);
  const redirectedToLogin = r.status >= 300 && r.status < 400 && (r.location ?? "").includes("/login");
  return {
    name: "dashboard_guard",
    ok: redirectedToLogin,
    statusCode: r.status,
    latencyMs: r.latencyMs,
    details: r.location
  };
}

async function checkCanonicalRedirect(baseUrl: string, slug: string): Promise<SyntheticCheck> {
  const r = await timedFetch(`${baseUrl}/s/${slug}`);
  const redirectTarget = r.location ?? "";
  const isRedirect = r.status >= 300 && r.status < 400;
  const ok = isRedirect && redirectTarget.includes(`/${slug}`);
  return {
    name: "canonical_redirect",
    ok,
    statusCode: r.status,
    latencyMs: r.latencyMs,
    details: redirectTarget || undefined
  };
}

async function checkLogin(): Promise<SyntheticCheck> {
  const startedAt = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const email = process.env.SYNTHETIC_LOGIN_EMAIL?.trim();
  const password = process.env.SYNTHETIC_LOGIN_PASSWORD?.trim();

  if (!url || !anonKey || !email || !password) {
    return {
      name: "login",
      ok: false,
      statusCode: 500,
      latencyMs: Date.now() - startedAt,
      details: "Missing NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY/SYNTHETIC_LOGIN_EMAIL/SYNTHETIC_LOGIN_PASSWORD"
    };
  }

  const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) {
    await supabase.auth.signOut();
  }

  return {
    name: "login",
    ok: !error,
    statusCode: error ? 401 : 200,
    latencyMs: Date.now() - startedAt,
    details: error?.message
  };
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  if (!validateCronSecret(req.headers, getMonitorSecret())) {
    await recordOperationalEvent({
      eventType: "synthetic_monitor_failed",
      flow: "synthetic",
      outcome: "failure",
      requestId,
      statusCode: 401,
      metadata: { reason: "unauthorized" }
    });
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: { "x-request-id": requestId } });
  }

  const baseUrl = getBaseUrl();
  const slug = getBookingSlug();

  const checks = await Promise.all([
    checkHealth(baseUrl),
    checkPublicBooking(baseUrl, slug),
    checkDashboardGuard(baseUrl),
    checkCanonicalRedirect(baseUrl, slug),
    checkLogin()
  ]);

  for (const check of checks) {
    await recordOperationalEvent({
      eventType: check.ok ? `synthetic_${check.name}_success` : `synthetic_${check.name}_failed`,
      flow: check.name === "login" ? "auth" : "synthetic",
      outcome: check.ok ? "success" : "failure",
      requestId,
      statusCode: check.statusCode,
      latencyMs: check.latencyMs,
      metadata: {
        baseUrl,
        bookingSlug: slug,
        details: check.details ?? null
      }
    });

    await recordOperationalEvent({
      eventType: "api_probe",
      flow: "api",
      outcome: check.ok ? "success" : "failure",
      requestId,
      statusCode: check.statusCode,
      latencyMs: check.latencyMs,
      metadata: { check: check.name }
    });
  }

  const failed = checks.filter((c) => !c.ok);
  if (failed.length > 0) {
    reportError("cron", "synthetic_monitor_failed", `Failed checks: ${failed.map((f) => f.name).join(", ")}`, {
      requestId,
      failed: failed.map((f) => ({ name: f.name, statusCode: f.statusCode, details: f.details }))
    });
  }

  return NextResponse.json(
    {
      ok: failed.length === 0,
      requestId,
      checks,
      failedChecks: failed.map((f) => f.name),
      ranAt: new Date().toISOString()
    },
    { status: failed.length === 0 ? 200 : 503, headers: { "x-request-id": requestId } }
  );
}
