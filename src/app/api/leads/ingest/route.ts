import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/config/env";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { reportError } from "@/lib/observability";

export const dynamic = "force-dynamic";

interface ApifyLead {
  title?: string;
  phone?: string;
  website?: string;
  street?: string;
  city?: string;
  categoryName?: string;
  url?: string;
  email?: string;
}

export async function POST(req: NextRequest) {
  if (!validateWebhookSecret(req.headers, env.optional("APIFY_WEBHOOK_SECRET"))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { runId, datasetId, items } = normalizePayload(payload);
  const leads = items ?? (datasetId ? await fetchApifyDataset(datasetId) : null);

  if (!leads || leads.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0, skipped: 0, total: 0 });
  }

  const admin = createSupabaseServiceClient();
  let inserted = 0;
  let skipped = 0;

  for (const item of leads) {
    const businessName = item.title?.trim();
    if (!businessName) {
      skipped += 1;
      continue;
    }

    const phone = normalizeValue(item.phone);
    const website = normalizeWebsite(item.website);
    const email = normalizeValue(item.email);

    if (!phone && !website && !email) {
      skipped += 1;
      continue;
    }

    const { error } = await admin.from("outreach_leads").upsert(
      {
        business_name: businessName,
        phone,
        email,
        website,
        street: normalizeValue(item.street),
        city: normalizeValue(item.city),
        category: normalizeValue(item.categoryName),
        google_maps_url: normalizeValue(item.url),
        apify_run_id: runId ?? null,
        status: "pending"
      },
      { onConflict: "business_name_key,phone", ignoreDuplicates: true }
    );

    if (error) {
      reportError("cron", "lead_ingest_upsert_failed", error, { businessName });
      skipped += 1;
      continue;
    }

    inserted += 1;
  }

  return NextResponse.json({ ok: true, inserted, skipped, total: leads.length });
}

function validateWebhookSecret(headers: Headers, configuredSecret?: string): boolean {
  const expected = configuredSecret?.trim();
  if (!expected) {
    return false;
  }

  const bearer = headers.get("authorization")?.trim();
  if (bearer?.startsWith("Bearer ")) {
    return bearer.slice("Bearer ".length).trim() === expected;
  }

  return headers.get("x-apify-webhook-secret")?.trim() === expected;
}

function normalizePayload(payload: unknown): { runId?: string; datasetId?: string; items?: ApifyLead[] } {
  if (Array.isArray(payload)) {
    return { items: payload as ApifyLead[] };
  }

  if (!payload || typeof payload !== "object") {
    return {};
  }

  const objectPayload = payload as Record<string, unknown>;
  const items = Array.isArray(objectPayload.items) ? (objectPayload.items as ApifyLead[]) : undefined;
  const resource = objectPayload.resource as Record<string, unknown> | undefined;
  return {
    runId: typeof objectPayload.runId === "string" ? objectPayload.runId : typeof resource?.runId === "string" ? (resource.runId as string) : undefined,
    datasetId: typeof objectPayload.datasetId === "string" ? objectPayload.datasetId : typeof resource?.defaultDatasetId === "string" ? (resource.defaultDatasetId as string) : undefined,
    items
  };
}

async function fetchApifyDataset(datasetId: string): Promise<ApifyLead[]> {
  const token = env.optional("APIFY_TOKEN");
  const url = new URL(`https://api.apify.com/v2/datasets/${encodeURIComponent(datasetId)}/items`);
  url.searchParams.set("format", "json");
  url.searchParams.set("clean", "true");
  url.searchParams.set("limit", "1000");
  if (token) {
    url.searchParams.set("token", token);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Apify dataset fetch failed with ${response.status}`);
  }

  return (await response.json()) as ApifyLead[];
}

function normalizeValue(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== "undefined" && trimmed !== "null" ? trimmed : null;
}

function normalizeWebsite(value: string | undefined | null): string | null {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized.startsWith("http") ? normalized : `https://${normalized}`);
    return url.toString();
  } catch {
    return normalized;
  }
}
