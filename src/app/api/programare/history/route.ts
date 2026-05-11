import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getRequestId } from "@/lib/ops-events";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

const querySchema = z.object({
  booking: z.string().uuid()
});

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  try {
    const { booking } = querySchema.parse({
      booking: req.nextUrl.searchParams.get("booking")
    });

    const admin = createSupabaseServiceClient();

    // Get booking to verify it exists
    const { data: bookingData, error: bookingErr } = await admin
      .from("programari")
      .select("id, profesionist_id")
      .eq("id", booking)
      .maybeSingle();

    if (bookingErr || !bookingData) {
      return NextResponse.json(
        { ok: false, error: "Programare nu găsit." },
        { status: 404, headers: { "x-request-id": requestId } }
      );
    }

    // Fetch status events (simple read, no auth needed for now - can be enhanced)
    const { data: events, error: eventsErr } = await admin
      .from("programari_status_events")
      .select("id, status, source, created_at")
      .eq("programare_id", booking)
      .order("created_at", { ascending: false });

    if (eventsErr) {
      return NextResponse.json(
        { ok: false, error: "Eroare la încărcare istoric." },
        { status: 500, headers: { "x-request-id": requestId } }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        events: events ?? []
      },
      { headers: { "x-request-id": requestId } }
    );
  } catch (err) {
    console.error("[booking-history] error", err);
    return NextResponse.json(
      { ok: false, error: "Eroare internă." },
      { status: 500, headers: { "x-request-id": getRequestId(req.headers) } }
    );
  }
}
