/**
 * POST /api/jobs/import-apify-run
 * Backward-compatible route name, now powered by a free OSM Overpass scraper.
 * Protected by OUTREACH_CRON_SECRET.
 *
 * Body: { city?: string; bbox?: [south,west,north,east]; limit?: number; runId?: string }
 */
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/config/env";
import { validateCronSecret } from "@/lib/cron-auth";
import { scrapeFreeLeads } from "@/lib/outreach/free-scraper";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { reportError } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = env.optional("OUTREACH_CRON_SECRET") ?? env.optional("CRON_SECRET");
  if (!validateCronSecret(req.headers, secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    runId?: string;
    city?: string;
    bbox?: [number, number, number, number];
    limit?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const runId = body.runId?.trim() || `free-${new Date().toISOString()}`;

  let places: Awaited<ReturnType<typeof scrapeFreeLeads>>;
  try {
    places = await scrapeFreeLeads({
      city: body.city,
      bbox: body.bbox,
      limit: body.limit
    });
  } catch (err) {
    reportError("cron", "free_scraper_fetch_failed", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch free dataset" }, { status: 502 });
  }

  const admin = createSupabaseServiceClient();
  let inserted = 0;
  let skipped = 0;

  for (const place of places) {
    const businessName = place.businessName?.trim();
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
      category: place.category?.trim() || null,
      google_maps_url: place.googleMapsUrl?.trim() || null,
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
    source: "overpass-osm",
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
