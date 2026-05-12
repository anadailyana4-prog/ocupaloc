/**
 * POST /api/jobs/import-apify-run
 * Fetches a completed Apify dataset and upserts results into outreach_leads.
 * Protected by OUTREACH_CRON_SECRET.
 *
 * Body: { runId: string; datasetId: string }
 */
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/config/env";
import { validateCronSecret } from "@/lib/cron-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { reportError } from "@/lib/observability";

export const dynamic = "force-dynamic";

interface ApifyPlace {
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
  const secret = env.optional("OUTREACH_CRON_SECRET");
  if (!validateCronSecret(req.headers, secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { runId?: string; datasetId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { runId, datasetId } = body;
  if (!datasetId || !runId) {
    return NextResponse.json({ ok: false, error: "Missing runId or datasetId" }, { status: 400 });
  }

  const apifyToken = env.optional("APIFY_TOKEN");
  const tokenParam = apifyToken ? `&token=${encodeURIComponent(apifyToken)}` : "";
  const url = `https://api.apify.com/v2/datasets/${encodeURIComponent(datasetId)}/items?format=json&clean=true&limit=1000${tokenParam}`;

  let places: ApifyPlace[];
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Apify API returned ${resp.status}`);
    }
    places = (await resp.json()) as ApifyPlace[];
  } catch (err) {
    reportError("cron", "apify_fetch_failed", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch Apify dataset" }, { status: 502 });
  }

  const admin = createSupabaseServiceClient();
  let inserted = 0;
  let skipped = 0;

  for (const place of places) {
    const businessName = place.title?.trim();
    if (!businessName) {
      skipped++;
      continue;
    }

    // Only store leads that have at least a website or phone (gives us a contact surface)
    const phone = place.phone?.trim() || null;
    const website = normalizeWebsite(place.website);
    if (!phone && !website) {
      skipped++;
      continue;
    }

    const row = {
      business_name: businessName,
      phone,
      email: place.email?.trim() || null,
      website,
      street: place.street?.trim() || null,
      city: place.city?.trim() || null,
      category: place.categoryName?.trim() || null,
      google_maps_url: place.url?.trim() || null,
      apify_run_id: runId,
      status: "pending" as const
    };

    const { error } = await admin
      .from("outreach_leads")
      .upsert(row, { onConflict: "business_name_key,phone", ignoreDuplicates: true });

    if (error) {
      // Log and continue — don't abort the whole batch on a single conflict
      skipped++;
    } else {
      inserted++;
    }
  }

  return NextResponse.json({
    ok: true,
    total: places.length,
    inserted,
    skipped
  });
}

function normalizeWebsite(raw: string | undefined | null): string | null {
  if (!raw || raw === "undefined" || raw === "null") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    return u.toString();
  } catch {
    return trimmed;
  }
}
