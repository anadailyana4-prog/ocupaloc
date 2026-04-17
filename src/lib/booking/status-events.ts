import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export type BookingStatusEventSource = "client_link" | "salon_dashboard" | "salon_reschedule";

export async function logBookingStatusEvent(input: {
  bookingId: string;
  status: "confirmat" | "anulat" | "finalizat";
  source: BookingStatusEventSource;
}): Promise<void> {
  try {
    const admin = createSupabaseServiceClient();
    const { data: booking } = await admin.from("programari").select("profesionist_id").eq("id", input.bookingId).maybeSingle();
    if (!booking?.profesionist_id) {
      return;
    }
    await admin.from("programari_status_events").insert({
      profesionist_id: booking.profesionist_id,
      programare_id: input.bookingId,
      status: input.status,
      source: input.source
    });
  } catch (err) {
    console.error("[status-events] logBookingStatusEvent failed", {
      bookingId: input.bookingId,
      status: input.status,
      source: input.source,
      error: err instanceof Error ? err.message : String(err)
    });
  }
}
