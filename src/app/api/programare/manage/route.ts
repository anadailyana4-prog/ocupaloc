import { isBefore } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { NextRequest, NextResponse } from "next/server";

import { verifyBookingManagementLink } from "@/lib/booking/confirmation-link";
import { getOccupiedIntervals } from "@/lib/booking/occupied-intervals";
import { logBookingStatusEvent } from "@/lib/booking/status-events";
import { notifyProfesionistStatusUpdate } from "@/lib/email/programare-notify";
import { reportError } from "@/lib/observability";
import { parseProgramJson } from "@/lib/program";
import { calcDataFinalProgramare, computeFreeSlots } from "@/lib/slots";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

function redirectManage(req: NextRequest, params: { booking: string; exp: string; sig: string; state: string }) {
  const url = new URL("/programare/gestioneaza", req.url);
  url.searchParams.set("booking", params.booking);
  url.searchParams.set("exp", params.exp);
  url.searchParams.set("sig", params.sig);
  url.searchParams.set("state", params.state);
  return NextResponse.redirect(url);
}

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const booking = String(data.get("booking") ?? "");
  const exp = String(data.get("exp") ?? "");
  const sig = String(data.get("sig") ?? "");
  const op = String(data.get("op") ?? "");

  if (!booking || !exp || !sig) {
    return NextResponse.redirect(new URL("/programare/confirmare?state=invalid", req.url));
  }

  const verify = verifyBookingManagementLink({ bookingId: booking, exp, sig });
  if (!verify.ok) {
    return NextResponse.redirect(new URL("/programare/confirmare?state=invalid", req.url));
  }

  const admin = createSupabaseServiceClient();
  const { data: current } = await admin
    .from("programari")
    .select("id,status,profesionist_id,serviciu_id")
    .eq("id", booking)
    .maybeSingle();

  if (!current?.id) {
    return NextResponse.redirect(new URL("/programare/confirmare?state=not_found", req.url));
  }

  if (current.status === "finalizat") {
    return redirectManage(req, { booking, exp, sig, state: "invalid_state" });
  }

  if (op === "confirm" || op === "cancel") {
    const targetStatus = op === "cancel" ? "anulat" : "confirmat";
    const { error } = await admin.from("programari").update({ status: targetStatus }).eq("id", booking);

    if (!error) {
      await logBookingStatusEvent({
        bookingId: booking,
        status: targetStatus,
        source: "client_link"
      });
      try {
        await notifyProfesionistStatusUpdate(booking, targetStatus, "client");
      } catch (notifyError) {
        reportError("email", "notify_profesionist_client_manage_failed", notifyError, {
          bookingId: booking,
          status: targetStatus
        });
      }
    }

    return redirectManage(req, {
      booking,
      exp,
      sig,
      state: error ? "error" : op === "cancel" ? "cancelled" : "confirmed"
    });
  }

  if (op === "reschedule") {
    if (current.status !== "confirmat") {
      return redirectManage(req, { booking, exp, sig, state: "invalid_state" });
    }

    const newStartLocal = String(data.get("newStartLocal") ?? "");
    if (!newStartLocal) {
      return redirectManage(req, { booking, exp, sig, state: "invalid_slot" });
    }

    const newStart = toDate(`${newStartLocal}:00`, { timeZone: "Europe/Bucharest" });
    if (!Number.isFinite(newStart.getTime())) {
      return redirectManage(req, { booking, exp, sig, state: "invalid_slot" });
    }

    if (newStart.getTime() <= Date.now()) {
      return redirectManage(req, { booking, exp, sig, state: "past_time" });
    }

    const { data: srv } = await admin.from("servicii").select("durata_minute").eq("id", current.serviciu_id).maybeSingle();
    const { data: prof } = await admin
      .from("profesionisti")
      .select("program,pauza_intre_clienti,timp_pregatire,lucreaza_acasa,smart_rules_enabled,smart_min_notice_minutes")
      .eq("id", current.profesionist_id)
      .maybeSingle();

    if (!srv || !prof) {
      return redirectManage(req, { booking, exp, sig, state: "error" });
    }

    if (prof.smart_rules_enabled) {
      const minNotice = Number(prof.smart_min_notice_minutes ?? 0);
      if (minNotice > 0) {
        const minAllowed = Date.now() + minNotice * 60_000;
        if (newStart.getTime() < minAllowed) {
          return redirectManage(req, { booking, exp, sig, state: "invalid_slot" });
        }
      }
    }

    const dayStr = formatInTimeZone(newStart, "Europe/Bucharest", "yyyy-MM-dd");
    const startDay = `${dayStr}T00:00:00.000Z`;
    const endDay = `${dayStr}T23:59:59.999Z`;

    const occupied = await getOccupiedIntervals(admin, {
      profesionistId: String(current.profesionist_id),
      startDayIso: startDay,
      endDayIso: endDay,
      excludeProgramareId: booking
    });

    const prep = prof.lucreaza_acasa ? Number(prof.timp_pregatire ?? 0) : 0;
    const slots = computeFreeSlots(
      dayStr,
      parseProgramJson(prof.program),
      Number(srv.durata_minute ?? 0),
      Number(prof.pauza_intre_clienti ?? 0),
      prep,
      occupied
    );

    const slotAllowed = slots.some((slot) => Math.abs(slot.getTime() - newStart.getTime()) < 60 * 1000);
    if (!slotAllowed) {
      return redirectManage(req, { booking, exp, sig, state: "invalid_slot" });
    }

    const hasEarlier = occupied.some((it) => isBefore(it.start, newStart));
    const newEnd = calcDataFinalProgramare(newStart, Number(srv.durata_minute ?? 0), Number(prof.pauza_intre_clienti ?? 0), prep, !hasEarlier);

    const { error } = await admin
      .from("programari")
      .update({
        data_start: newStart.toISOString(),
        data_final: newEnd.toISOString(),
        status: "confirmat"
      })
      .eq("id", booking);

    if (!error) {
      await logBookingStatusEvent({
        bookingId: booking,
        status: "confirmat",
        source: "client_link"
      });
      try {
        await notifyProfesionistStatusUpdate(booking, "confirmat", "client");
      } catch (notifyError) {
        reportError("email", "notify_profesionist_client_reschedule_failed", notifyError, {
          bookingId: booking
        });
      }
    }

    return redirectManage(req, { booking, exp, sig, state: error ? "error" : "rescheduled" });
  }

  return redirectManage(req, { booking, exp, sig, state: "error" });
}
