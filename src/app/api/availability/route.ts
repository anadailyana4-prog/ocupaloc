/**
 * DEPRECATED: /api/availability
 * 
 * This endpoint is deprecated in favor of `/api/public/slots`.
 * Both routes share the same underlying implementation (getPublicSlots helper).
 * 
 * Kept for backward compatibility with existing client code.
 * Successor: GET /api/public/slots (preferred, returns simpler response)
 * 
 * Parameter mapping:
 *   - org → slug
 *   - service → serviciuId
 *   - date → date
 */

import { NextRequest, NextResponse } from "next/server";

import { getPublicSlots } from "@/lib/booking/get-public-slots";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

const deprecationHeaders = {
  Deprecation: "true",
  Link: '</api/public/slots>; rel="successor-version"'
};

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get("org") ?? "unknown").trim().toLowerCase();
  const admin = createSupabaseServiceClient();
  const rateLimit = await checkApiRateLimit(admin, `api:availability:${slug}:${ip}`, 60, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ slots: [], error: "Too many requests" }, {
      status: 429,
      headers: deprecationHeaders
    });
  }

  const slugParam = searchParams.get("org");
  const serviceId = searchParams.get("service");
  const date = searchParams.get("date");

  if (!slugParam || !serviceId || !date) {
    return NextResponse.json({ slots: [], error: "Parametri lipsă: org, service, date." }, { status: 400, headers: deprecationHeaders });
  }

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRe.test(date)) {
    return NextResponse.json({ slots: [], error: "Format dată invalid (YYYY-MM-DD)." }, { status: 400, headers: deprecationHeaders });
  }

  const result = await getPublicSlots(admin, {
    slug: slugParam,
    serviceId,
    date
  });
  if (!result.ok) {
    return NextResponse.json({ slots: [], error: result.error }, { status: result.status, headers: deprecationHeaders });
  }

  return NextResponse.json({
    slots: result.slots.map((slot) => ({
      staff_id: result.prof.user_id,
      start_time: slot.toISOString(),
      end_time: new Date(slot.getTime() + result.srv.durata_minute * 60_000).toISOString()
    })),
    error: null
  }, { headers: deprecationHeaders });
}
