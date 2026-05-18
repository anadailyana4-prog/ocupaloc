import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/config/env";
import { logWarn } from "@/lib/logger";
import { getRequestId, type OperationalEventInput, recordOperationalEvent } from "@/lib/ops-events";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type AllowedEvent = {
  eventType: string;
  flow: OperationalEventInput["flow"];
  outcome: OperationalEventInput["outcome"];
};

const ALLOWED_EVENTS: Record<string, AllowedEvent> = {
  site_visit_started: { eventType: "site_visit_started", flow: "growth", outcome: "success" },
  site_page_view: { eventType: "site_page_view", flow: "growth", outcome: "success" },
  site_visit_ended: { eventType: "site_visit_ended", flow: "growth", outcome: "success" },
  booking_public_page_view: { eventType: "booking_public_page_view", flow: "booking", outcome: "success" },
  booking_service_selected: { eventType: "booking_service_selected", flow: "booking", outcome: "success" },
  booking_day_selected: { eventType: "booking_day_selected", flow: "booking", outcome: "success" },
  booking_slot_selected: { eventType: "booking_slot_selected", flow: "booking", outcome: "success" },
  booking_form_started: { eventType: "booking_form_started", flow: "booking", outcome: "success" },
  booking_submit_started: { eventType: "booking_submit_started", flow: "booking", outcome: "success" },
  booking_submit_success: { eventType: "booking_submit_success", flow: "booking", outcome: "success" },
  booking_submit_failed: { eventType: "booking_submit_failed", flow: "booking", outcome: "failure" },
  onboarding_signup_view: { eventType: "onboarding_signup_view", flow: "onboarding", outcome: "success" },
  onboarding_step_completed: { eventType: "onboarding_step_completed", flow: "onboarding", outcome: "success" },
  onboarding_profile_completed: { eventType: "onboarding_profile_completed", flow: "onboarding", outcome: "success" },
  onboarding_activation: { eventType: "onboarding_activation", flow: "onboarding", outcome: "success" },
  growth_cta_click: { eventType: "growth_cta_click", flow: "growth", outcome: "success" },
  referral_attributed_visit: { eventType: "referral_attributed_visit", flow: "growth", outcome: "success" }
};

const MAX_REQUESTS_PER_IP = 120;
const WINDOW_MS = 10 * 60 * 1000;

function normalizedOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isAllowedOrigin(req: NextRequest): boolean {
  const configuredSiteOrigin = normalizedOrigin(env.optional("NEXT_PUBLIC_SITE_URL") ?? "");
  const allowed = new Set<string>(["https://ocupaloc.ro", "https://www.ocupaloc.ro"]);

  if (configuredSiteOrigin) {
    allowed.add(configuredSiteOrigin);
    if (configuredSiteOrigin.startsWith("https://www.")) {
      allowed.add(configuredSiteOrigin.replace("https://www.", "https://"));
    } else if (configuredSiteOrigin.startsWith("https://")) {
      allowed.add(configuredSiteOrigin.replace("https://", "https://www."));
    }
  }

  const incomingOrigin = normalizedOrigin(req.headers.get("origin") ?? "");
  const incomingRefererOrigin = normalizedOrigin(req.headers.get("referer") ?? "");

  // Require browser context markers and pin both values to trusted first-party origins.
  if (!incomingOrigin || !incomingRefererOrigin) {
    return false;
  }

  if (!allowed.has(incomingOrigin) || !allowed.has(incomingRefererOrigin)) {
    return false;
  }

  return incomingOrigin === incomingRefererOrigin;
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const xr = req.headers.get("x-real-ip")?.trim();
  return xff || xr || "unknown";
}

function pickMetadata(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const source = raw as Record<string, unknown>;
  const allowed = [
    "page",
    "cta_location",
    "target_path",
    "slug",
    "service_id",
    "slot",
    "mode",
    "reason",
    "step",
    "variant",
    "experiment_id",
    "referral_source",
    "referral_code",
    "anon_id",
    "session_id",
    "visit_id",
    "title",
    "referrer",
    "duration_ms",
    "pages_viewed",
    "page_index",
    "is_entry"
  ];
  const metadata: Record<string, unknown> = {};
  for (const key of allowed) {
    const value = source[key];
    if (value === null || value === undefined) continue;
    if (typeof value === "string") {
      metadata[key] = value.slice(0, 180);
      continue;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      metadata[key] = value;
    }
  }
  return metadata;
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  if (!isAllowedOrigin(req)) {
    logWarn("[ops:track-event] rejected origin", {
      requestId,
      origin: req.headers.get("origin") ?? "",
      referer: req.headers.get("referer") ?? ""
    });
    return NextResponse.json({ ok: false, requestId, error: "Forbidden" }, { status: 403 });
  }

  const ip = getClientIp(req);
  try {
    const admin = createSupabaseServiceClient();
    const rateLimit = await checkApiRateLimit(admin, `ops:track-event:ip:${ip}`, MAX_REQUESTS_PER_IP, WINDOW_MS);
    if (!rateLimit.allowed) {
      logWarn("[ops:track-event] rate limited", { requestId, ip });
      return NextResponse.json({ ok: false, requestId, error: "Too many requests" }, { status: 429 });
    }
  } catch (error) {
    logWarn("[ops:track-event] rate-limit dependency failed", { requestId, ip }, error);
    return NextResponse.json({ ok: false, requestId, error: "Service unavailable" }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as { eventName?: string; payload?: unknown };
  const eventName = typeof body.eventName === "string" ? body.eventName : "";
  const allowed = ALLOWED_EVENTS[eventName];

  if (!allowed) {
    logWarn("[ops:track-event] unsupported event", { requestId, eventName, ip });
    return NextResponse.json({ ok: false, requestId, error: "Unsupported event type." }, { status: 400 });
  }

  const metadata = pickMetadata(body.payload);

  await recordOperationalEvent({
    eventType: allowed.eventType,
    flow: allowed.flow,
    outcome: allowed.outcome,
    requestId,
    statusCode: 202,
    metadata: {
      source: "client_analytics",
      ...metadata
    }
  });

  return NextResponse.json({ ok: true, requestId });
}
