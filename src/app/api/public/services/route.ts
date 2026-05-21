import { NextRequest, NextResponse } from "next/server";

import { getPublicServices } from "@/lib/booking/get-public-services";
import { normalizeBookingSlug } from "@/lib/booking/normalize-booking-slug";
import { embedCorsOptions, withEmbedCors } from "@/lib/http/embed-cors";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

/**
 * GET /api/public/services?slug=...
 * Lista serviciilor active pentru pagina publică — folosită de widget-ul embed și de integrări.
 */
export async function OPTIONS() {
  return embedCorsOptions();
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const slugRaw = req.nextUrl.searchParams.get("slug");
  const normalizedSlug = normalizeBookingSlug(slugRaw ?? "unknown");
  const admin = createSupabaseServiceClient();
  const rateLimit = await checkApiRateLimit(admin, `api:public-services:${normalizedSlug}:${ip}`, 60, 60_000);
  if (!rateLimit.allowed) {
    return withEmbedCors(NextResponse.json({ error: "Too many requests" }, { status: 429 }));
  }

  if (!slugRaw?.trim()) {
    return withEmbedCors(NextResponse.json({ error: "Parametru slug lipsă." }, { status: 400 }));
  }

  try {
    const result = await getPublicServices(admin, slugRaw);
    if (!result.ok) {
      return withEmbedCors(NextResponse.json({ error: result.error }, { status: result.status }));
    }
    return withEmbedCors(NextResponse.json({ services: result.services }));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Eroare server.";
    return withEmbedCors(NextResponse.json({ error: message }, { status: 500 }));
  }
}
