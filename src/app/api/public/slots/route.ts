import { NextRequest, NextResponse } from "next/server";

import { getPublicSlots } from "@/lib/booking/get-public-slots";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { normalizeBookingSlug } from "@/lib/booking/normalize-booking-slug";
import { checkApiRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/public/slots
 *
 * Returns available booking slots for a profesionist on a given date.
 * No authentication required — public endpoint used by the booking widget.
 *
 * Rate limited: 60 requests per minute per slug + IP.
 *
 * @query slug      - Profesionist slug (e.g. "ana-nails")
 * @query serviciuId - UUID of the selected service
 * @query date      - ISO date string ("YYYY-MM-DD") in Europe/Bucharest timezone
 * @returns 200 with `{ slots: string[] }` (ISO datetime strings), or 4xx with `{ error }`.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const slugRaw = req.nextUrl.searchParams.get("slug");
  const normalizedSlug = normalizeBookingSlug(slugRaw ?? "unknown");
  const admin = createSupabaseServiceClient();
  const rateLimit = await checkApiRateLimit(admin, `api:public-slots:${normalizedSlug}:${ip}`, 60, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const slug = slugRaw ? normalizeBookingSlug(slugRaw) : null;
  const serviciuId = req.nextUrl.searchParams.get("serviciuId");
  const dateStr = req.nextUrl.searchParams.get("date");
  if (!slug || !serviciuId || !dateStr) {
    return NextResponse.json({ error: "Parametri lipsă." }, { status: 400 });
  }

  try {
    const result = await getPublicSlots(admin, {
      slug,
      serviceId: serviciuId,
      date: dateStr,
      normalizeSlug: false
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      slots: result.slots.map((d) => d.toISOString())
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Eroare server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
