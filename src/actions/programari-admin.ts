"use server";

import { isBefore, parseISO } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";

import { logBookingStatusEvent } from "@/lib/booking/status-events";
import { notifyClientBookingRescheduledByProvider } from "@/lib/email/programare-notify";
import { reportError } from "@/lib/observability";
import { calcDataFinalProgramare } from "@/lib/slots";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const TZ = "Europe/Bucharest";

async function getOwnerProfId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nu ești autentificat." as const, profId: null };
  const { data: prof } = await supabase.from("profesionisti").select("id").eq("user_id", user.id).maybeSingle();
  if (!prof) return { error: "Profil lipsă." as const, profId: null };
  return { error: null, profId: prof.id };
}

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return isBefore(aStart, bEnd) && isBefore(bStart, aEnd);
}

export async function createStaffProgramare(input: {
  serviciuId: string;
  dataStartIso: string;
  numeClient: string;
  telefonClient: string;
}) {
  const { profId, error } = await getOwnerProfId();
  if (!profId || error) return { ok: false as const, message: error ?? "Eroare." };

  const admin = createSupabaseServiceClient();
  const { data: srv, error: e1 } = await admin
    .from("servicii")
    .select("*")
    .eq("id", input.serviciuId)
    .eq("profesionist_id", profId)
    .maybeSingle();
  if (e1 || !srv) return { ok: false as const, message: "Serviciu invalid." };

  const { data: prof, error: e2 } = await admin.from("profesionisti").select("*").eq("id", profId).single();
  if (e2 || !prof) return { ok: false as const, message: "Profil invalid." };

  const dataStart = new Date(input.dataStartIso);
  if (Number.isNaN(dataStart.getTime())) return { ok: false as const, message: "Dată/oră invalidă." };

  const dateStr = formatInTimeZone(dataStart, TZ, "yyyy-MM-dd");
  const startDay = `${dateStr}T00:00:00.000Z`;
  const endDay = `${dateStr}T23:59:59.999Z`;

  const { data: progs } = await admin
    .from("programari")
    .select("data_start,data_final,status")
    .eq("profesionist_id", profId)
    .neq("status", "anulat")
    .lt("data_start", endDay)
    .gt("data_final", startDay);

  const ocupate = (progs ?? []).map((p) => ({
    start: new Date(p.data_start),
    end: new Date(p.data_final)
  }));

  const prep = prof.lucreaza_acasa ? prof.timp_pregatire : 0;
  const hasEarlier = ocupate.some((o) => isBefore(o.start, dataStart));
  const dataFinal = calcDataFinalProgramare(dataStart, srv.durata_minute, prof.pauza_intre_clienti, prep, !hasEarlier);

  const clash = ocupate.some((o) => rangesOverlap(dataStart, dataFinal, o.start, o.end));
  if (clash) return { ok: false as const, message: "Interval ocupat. Alege altă oră." };

  const { data: inserted, error: ins } = await admin.from("programari").insert({
    profesionist_id: profId,
    serviciu_id: srv.id,
    nume_client: input.numeClient.trim(),
    telefon_client: input.telefonClient.trim(),
    email_client: null,
    data_start: dataStart.toISOString(),
    data_final: dataFinal.toISOString(),
    status: "confirmat",
    creat_de: "profesionist"
  }).select("id").single();
  if (ins) return { ok: false as const, message: ins.message };
  if (inserted?.id) {
    await logBookingStatusEvent({ bookingId: inserted.id, status: "confirmat", source: "salon_manual" });
  }
  return { ok: true as const };
}

export async function moveProgramare(input: { programareId: string; targetDateStr: string }) {
  const { profId, error } = await getOwnerProfId();
  if (!profId || error) return { ok: false as const, message: error ?? "Eroare." };

  const admin = createSupabaseServiceClient();
  const { data: row, error: e1 } = await admin
    .from("programari")
    .select("id, data_start, profesionist_id, serviciu_id")
    .eq("id", input.programareId)
    .eq("profesionist_id", profId)
    .maybeSingle();
  if (e1 || !row) return { ok: false as const, message: "Programare negăsită." };

  const { data: srv } = await admin.from("servicii").select("durata_minute").eq("id", row.serviciu_id).single();
  const { data: prof } = await admin.from("profesionisti").select("*").eq("id", profId).single();
  if (!srv || !prof) return { ok: false as const, message: "Date incomplete." };

  const hm = formatInTimeZone(parseISO(row.data_start), TZ, "HH:mm:ss");
  const newStart = toDate(`${input.targetDateStr}T${hm}`, { timeZone: TZ });
  if (Number.isNaN(newStart.getTime())) return { ok: false as const, message: "Dată invalidă." };

  const dayStr = input.targetDateStr;
  const startDay = `${dayStr}T00:00:00.000Z`;
  const endDay = `${dayStr}T23:59:59.999Z`;

  const { data: progs } = await admin
    .from("programari")
    .select("id, data_start, data_final, status")
    .eq("profesionist_id", profId)
    .neq("status", "anulat")
    .neq("id", row.id)
    .lt("data_start", endDay)
    .gt("data_final", startDay);

  const ocupate = (progs ?? []).map((p) => ({
    start: new Date(p.data_start),
    end: new Date(p.data_final)
  }));

  const prep = prof.lucreaza_acasa ? prof.timp_pregatire : 0;
  const hasEarlier = ocupate.some((o) => isBefore(o.start, newStart));
  const newEnd = calcDataFinalProgramare(newStart, srv.durata_minute, prof.pauza_intre_clienti, prep, !hasEarlier);

  const clash = ocupate.some((o) => rangesOverlap(newStart, newEnd, o.start, o.end));
  if (clash) return { ok: false as const, message: "Nu încape în acest interval." };

  const { error: up } = await admin
    .from("programari")
    .update({ data_start: newStart.toISOString(), data_final: newEnd.toISOString() })
    .eq("id", row.id)
    .eq("profesionist_id", profId);
  if (up) return { ok: false as const, message: up.message };
  await logBookingStatusEvent({ bookingId: row.id, status: "confirmat", source: "salon_reschedule" });
  try {
    await notifyClientBookingRescheduledByProvider(row.id);
  } catch (error) {
    reportError("email", "notify_client_reschedule_failed", error, { bookingId: row.id });
  }
  return { ok: true as const };
}

export async function rescheduleProgramare(input: { programareId: string; dataStartIso: string }) {
  const { profId, error } = await getOwnerProfId();
  if (!profId || error) return { ok: false as const, message: error ?? "Eroare." };

  const admin = createSupabaseServiceClient();
  const { data: row, error: e1 } = await admin
    .from("programari")
    .select("id, profesionist_id, serviciu_id")
    .eq("id", input.programareId)
    .eq("profesionist_id", profId)
    .maybeSingle();
  if (e1 || !row) return { ok: false as const, message: "Programare negăsită." };

  const newStart = new Date(input.dataStartIso);
  if (Number.isNaN(newStart.getTime())) return { ok: false as const, message: "Dată/oră invalidă." };

  const { data: srv } = await admin.from("servicii").select("durata_minute").eq("id", row.serviciu_id).single();
  const { data: prof } = await admin.from("profesionisti").select("*").eq("id", profId).single();
  if (!srv || !prof) return { ok: false as const, message: "Date incomplete." };

  const dayStr = formatInTimeZone(newStart, TZ, "yyyy-MM-dd");
  const startDay = `${dayStr}T00:00:00.000Z`;
  const endDay = `${dayStr}T23:59:59.999Z`;

  const { data: progs } = await admin
    .from("programari")
    .select("id, data_start, data_final, status")
    .eq("profesionist_id", profId)
    .neq("status", "anulat")
    .neq("id", row.id)
    .lt("data_start", endDay)
    .gt("data_final", startDay);

  const ocupate = (progs ?? []).map((p) => ({
    start: new Date(p.data_start),
    end: new Date(p.data_final)
  }));

  const prep = prof.lucreaza_acasa ? prof.timp_pregatire : 0;
  const hasEarlier = ocupate.some((o) => isBefore(o.start, newStart));
  const newEnd = calcDataFinalProgramare(newStart, srv.durata_minute, prof.pauza_intre_clienti, prep, !hasEarlier);

  const clash = ocupate.some((o) => rangesOverlap(newStart, newEnd, o.start, o.end));
  if (clash) return { ok: false as const, message: "Interval ocupat. Alege altă oră." };

  const { error: up } = await admin
    .from("programari")
    .update({ data_start: newStart.toISOString(), data_final: newEnd.toISOString(), status: "confirmat" })
    .eq("id", row.id)
    .eq("profesionist_id", profId);
  if (up) return { ok: false as const, message: up.message };
  await logBookingStatusEvent({ bookingId: row.id, status: "confirmat", source: "salon_reschedule" });
  try {
    await notifyClientBookingRescheduledByProvider(row.id);
  } catch (error) {
    reportError("email", "notify_client_reschedule_failed", error, { bookingId: row.id });
  }
  return { ok: true as const };
}
