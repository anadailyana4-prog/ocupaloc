import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { verifyBookingConfirmationLink } from "@/lib/booking/confirmation-link";
import { notifyClientBookingRescheduled } from "@/lib/email/programare-notify";
import { reportError } from "@/lib/observability";
import { getRequestId, recordOperationalEvent } from "@/lib/ops-events";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

const TZ = "Europe/Bucharest";

const requestBodySchema = z.object({
  booking: z.string().uuid(),
  action: z.literal("reschedule"),
  exp: z.string(),
  sig: z.string(),
  newSlotStart: z.string().datetime(),
  newSlotEnd: z.string().datetime()
});

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const startedAt = Date.now();

  try {
    const bodyRaw = await req.json();
    const parsed = requestBodySchema.safeParse(bodyRaw);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Parametri invalizi." },
        { status: 400, headers: { "x-request-id": requestId } }
      );
    }

    const { booking, action, exp, sig, newSlotStart, newSlotEnd } = parsed.data;

    // Verify link signature
    const verified = verifyBookingConfirmationLink({
      bookingId: booking,
      action,
      exp,
      sig
    });

    if (!verified.ok) {
      return NextResponse.json(
        { ok: false, error: verified.message },
        { status: 400, headers: { "x-request-id": requestId } }
      );
    }

    const admin = createSupabaseServiceClient();

    // Fetch current booking
    const { data: current, error: fetchErr } = await admin
      .from("programari")
      .select("id, status, profesionist_id, serviciu_id, email_client, data_start, data_final, profesionisti(slug)")
      .eq("id", booking)
      .maybeSingle();

    if (fetchErr || !current?.id) {
      return NextResponse.json(
        { ok: false, error: "Programare nu găsit." },
        { status: 404, headers: { "x-request-id": requestId } }
      );
    }

    // Only allow reschedule for pending or confirmed bookings
    if (current.status !== "in_asteptare" && current.status !== "confirmat") {
      return NextResponse.json(
        { ok: false, error: `Programarea nu poate fi reprogramată (status: ${current.status}).` },
        { status: 400, headers: { "x-request-id": requestId } }
      );
    }

    // Validate new slot dates
    const newStart = new Date(newSlotStart);
    const newEnd = new Date(newSlotEnd);

    if (newStart >= newEnd) {
      return NextResponse.json(
        { ok: false, error: "Ora de start nu poate fi după ora de final." },
        { status: 400, headers: { "x-request-id": requestId } }
      );
    }

    // Check if new slot is in the past
    if (newEnd <= new Date()) {
      return NextResponse.json(
        { ok: false, error: "Nu poți reschedula la o oră din trecut." },
        { status: 400, headers: { "x-request-id": requestId } }
      );
    }

    // Check for slot conflicts with other bookings (exclude current booking)
    const { data: conflicts, error: conflictErr } = await admin
      .from("programari")
      .select("id")
      .eq("profesionist_id", current.profesionist_id)
      .neq("id", booking)
      .neq("status", "anulat")
      .lt("data_final", newEnd.toISOString())
      .gt("data_start", newStart.toISOString());

    if (conflictErr) {
      reportError("booking", "reschedule_conflict_check_failed", conflictErr, { bookingId: booking });
      return NextResponse.json(
        { ok: false, error: "Eroare la verificare disponibilitate." },
        { status: 500, headers: { "x-request-id": requestId } }
      );
    }

    if ((conflicts ?? []).length > 0) {
      return NextResponse.json(
        { ok: false, error: "Slotul nu este disponibil. A fost ocupat în timp ce ălegi." },
        { status: 409, headers: { "x-request-id": requestId } }
      );
    }

    // Update booking with new time
    const { error: updateErr } = await admin
      .from("programari")
      .update({
        data_start: newStart.toISOString(),
        data_final: newEnd.toISOString()
      })
      .eq("id", booking)
      .in("status", ["in_asteptare", "confirmat"]);

    if (updateErr) {
      reportError("booking", "reschedule_update_failed", updateErr, { bookingId: booking });
      return NextResponse.json(
        { ok: false, error: "Eroare la salvare. Încearcă din nou." },
        { status: 500, headers: { "x-request-id": requestId } }
      );
    }

    // Log status event (track that reschedule happened)
    // No status change needed - booking remains confirmed/pending
    try {
      const admin2 = createSupabaseServiceClient();
      await admin2.from("programari_status_events").insert({
        profesionist_id: current.profesionist_id,
        programare_id: booking,
        status: "reprogramata",
        source: "client_link"
      });
    } catch (logErr) {
      // Log but don't fail
      console.error("[reschedule] status event log failed", { bookingId: booking, error: logErr });
    }

    // Update reminders if needed (clear old, new will be generated on next cron)
    try {
      await admin.from("programari_reminders").delete().eq("programare_id", booking);
    } catch (err) {
      // Log but don't fail - reminders can be re-sent
      console.error("[reschedule] reminder cleanup failed", { bookingId: booking, error: err });
    }

    // Send notification email
    try {
      await notifyClientBookingRescheduled(booking);
    } catch (emailErr) {
      reportError("email", "reschedule_notification_failed", emailErr, { bookingId: booking });
    }

    await recordOperationalEvent({
      eventType: "booking_rescheduled",
      flow: "booking",
      outcome: "success",
      requestId,
      entityId: booking,
      statusCode: 200,
      latencyMs: Date.now() - startedAt,
      metadata: { source: "client_link", oldStart: current.data_start, newStart: newStart.toISOString() }
    });

    return NextResponse.json(
      {
        ok: true,
        booking,
        newStart: newStart.toISOString(),
        newEnd: newEnd.toISOString(),
        profSlug: (current.profesionisti as { slug?: string } | null)?.slug
      },
      { headers: { "x-request-id": requestId } }
    );
  } catch (err) {
    reportError("booking", "reschedule_handler_error", err, { requestId });
    await recordOperationalEvent({
      eventType: "booking_reschedule_error",
      flow: "booking",
      outcome: "failure",
      requestId,
      statusCode: 500,
      latencyMs: Date.now() - startedAt,
      metadata: { error: err instanceof Error ? err.message : String(err) }
    });
    return NextResponse.json(
      { ok: false, error: "Eroare interna." },
      { status: 500, headers: { "x-request-id": requestId } }
    );
  }
}
