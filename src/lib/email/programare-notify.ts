import { formatInTimeZone } from "date-fns-tz";

import { createBookingConfirmationLink } from "@/lib/booking/confirmation-link";
import { reportError } from "@/lib/observability";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

const TZ = "Europe/Bucharest";

export type ProgramareNotifyInput = {
  /** profesionisti.email_contact */
  to: string | null | undefined;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  appointmentStart: Date;
};

async function sendResendEmail(input: {
  to: string[];
  subject: string;
  text: string;
  event: string;
  context?: Record<string, unknown>;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY lipsă");
  }

  if (!from) {
    throw new Error("RESEND_FROM lipsă");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body || input.event}`);
  }
}

/**
 * Notificare salon după programare nouă (Resend).
 * Fără RESEND_API_KEY emailul nu se trimite.
 */
export async function notifyProfesionistNewProgramare(input: ProgramareNotifyInput): Promise<void> {
  const dataStr = formatInTimeZone(input.appointmentStart, TZ, "dd.MM.yyyy");
  const timeStr = formatInTimeZone(input.appointmentStart, TZ, "HH:mm");
  const subject = `Rezervare nouă - ${input.clientName}`;
  const text = `${input.clientName} (${input.clientPhone}) a rezervat ${input.serviceName} pe ${dataStr} la ${timeStr}`;

  const dest = input.to?.trim();
  if (!dest) {
    return;
  }

  await sendResendEmail({
    to: [dest],
    subject,
    text,
    event: "notify_profesionist_new_booking_failed",
    context: { dest }
  });
}

type ProgramareNotifyContext = {
  profesionistEmail: string | null;
};

export async function notifyProfesionistDespreProgramare(programareId: string): Promise<ProgramareNotifyContext> {
  const admin = createSupabaseServiceClient();
  const { data: row, error } = await admin
    .from("programari")
    .select("nume_client, telefon_client, data_start, profesionisti(email_contact), servicii(nume)")
    .eq("id", programareId)
    .maybeSingle();

  if (error || !row) {
    console.error("[notifyProfesionistDespreProgramare] programare lipsa:", error?.message ?? "not found");
    return { profesionistEmail: null };
  }

  const relProf = row.profesionisti as { email_contact: string | null } | { email_contact: string | null }[] | null;
  const relServ = row.servicii as { nume: string } | { nume: string }[] | null;
  const profesionist = Array.isArray(relProf) ? relProf[0] ?? null : relProf;
  const serviciu = Array.isArray(relServ) ? relServ[0] ?? null : relServ;

  await notifyProfesionistNewProgramare({
    to: profesionist?.email_contact ?? null,
    clientName: row.nume_client,
    clientPhone: row.telefon_client,
    serviceName: serviciu?.nume ?? "Serviciu",
    appointmentStart: new Date(row.data_start)
  });

  return { profesionistEmail: profesionist?.email_contact ?? null };
}

export async function notifyClientBookingConfirmation(programareId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return;
  }

  const admin = createSupabaseServiceClient();
  const { data: row, error } = await admin
    .from("programari")
    .select("id, nume_client, email_client, data_start, profesionisti(slug, nume_business), servicii(nume)")
    .eq("id", programareId)
    .maybeSingle();

  if (error || !row) {
    return;
  }

  const clientEmail = row.email_client?.trim();
  if (!clientEmail) {
    return;
  }

  const relProf = row.profesionisti as { slug?: string; nume_business?: string | null } | { slug?: string; nume_business?: string | null }[] | null;
  const relServ = row.servicii as { nume?: string } | { nume?: string }[] | null;
  const profesionist = Array.isArray(relProf) ? relProf[0] ?? null : relProf;
  const serviciu = Array.isArray(relServ) ? relServ[0] ?? null : relServ;

  const salonName = profesionist?.nume_business?.trim() || "salon";
  const serviceName = serviciu?.nume?.trim() || "serviciu";
  const startsAt = new Date(String(row.data_start));
  const dataStr = formatInTimeZone(startsAt, TZ, "dd.MM.yyyy");
  const timeStr = formatInTimeZone(startsAt, TZ, "HH:mm");

  const confirmLink = createBookingConfirmationLink({ bookingId: row.id, action: "confirm" });
  const cancelLink = createBookingConfirmationLink({ bookingId: row.id, action: "cancel" });

  const subject = `Confirmă programarea la ${salonName}`;
  const text = [
    `Salut ${row.nume_client},`,
    "",
    `Ai o programare la ${salonName} pentru ${serviceName} pe ${dataStr} la ${timeStr}.`,
    "",
    `Confirmă: ${confirmLink}`,
    `Anulează: ${cancelLink}`,
    "",
    "Dacă nu ai făcut tu această rezervare, poți ignora acest email."
  ].join("\n");

  await sendResendEmail({
    to: [clientEmail],
    subject,
    text,
    event: "notify_client_booking_confirmation_failed",
    context: { clientEmail, bookingId: row.id }
  });
}

export async function notifyClientBookingCancelledBySalon(programareId: string): Promise<void> {
  const admin = createSupabaseServiceClient();
  const { data: row } = await admin
    .from("programari")
    .select("nume_client, email_client, data_start, profesionisti(nume_business), servicii(nume)")
    .eq("id", programareId)
    .maybeSingle();

  if (!row?.email_client) return;

  const relProf = row.profesionisti as { nume_business?: string | null } | { nume_business?: string | null }[] | null;
  const relServ = row.servicii as { nume?: string } | { nume?: string }[] | null;
  const profesionist = Array.isArray(relProf) ? relProf[0] ?? null : relProf;
  const serviciu = Array.isArray(relServ) ? relServ[0] ?? null : relServ;

  const salonName = profesionist?.nume_business?.trim() || "salon";
  const dataStr = formatInTimeZone(new Date(String(row.data_start)), TZ, "dd.MM.yyyy");
  const timeStr = formatInTimeZone(new Date(String(row.data_start)), TZ, "HH:mm");
  const subject = `Actualizare programare la ${salonName}`;
  const text = [
    `Salut ${row.nume_client},`,
    "",
    `Programarea ta pentru ${serviciu?.nume ?? "serviciu"} din ${dataStr}, ora ${timeStr}, a fost anulată de salon.`,
    "",
    "Dacă dorești, poți face o nouă rezervare folosind pagina salonului."
  ].join("\n");
  await sendResendEmail({
    to: [row.email_client.trim()],
    subject,
    text,
    event: "notify_client_booking_cancelled_failed",
    context: { programareId, clientEmail: row.email_client.trim() }
  });
}

export async function notifyClientBookingRescheduledBySalon(programareId: string): Promise<void> {
  const admin = createSupabaseServiceClient();
  const { data: row } = await admin
    .from("programari")
    .select("nume_client, email_client, data_start, profesionisti(nume_business,slug), servicii(nume)")
    .eq("id", programareId)
    .maybeSingle();

  if (!row?.email_client) return;

  const relProf = row.profesionisti as { nume_business?: string | null; slug?: string | null } | { nume_business?: string | null; slug?: string | null }[] | null;
  const relServ = row.servicii as { nume?: string } | { nume?: string }[] | null;
  const profesionist = Array.isArray(relProf) ? relProf[0] ?? null : relProf;
  const serviciu = Array.isArray(relServ) ? relServ[0] ?? null : relServ;

  const salonName = profesionist?.nume_business?.trim() || "salon";
  const dataStr = formatInTimeZone(new Date(String(row.data_start)), TZ, "dd.MM.yyyy");
  const timeStr = formatInTimeZone(new Date(String(row.data_start)), TZ, "HH:mm");
  const rebookUrl = `${(process.env.NEXT_PUBLIC_SITE_URL || "https://ocupaloc.ro").replace(/\/$/, "")}/${profesionist?.slug ?? ""}`;

  const subject = `Programare reprogramată la ${salonName}`;
  const text = [
    `Salut ${row.nume_client},`,
    "",
    `Programarea ta pentru ${serviciu?.nume ?? "serviciu"} a fost reprogramată de salon.`,
    `Noua dată: ${dataStr}, ora ${timeStr}.`,
    "",
    `Detalii/Reprogramare: ${rebookUrl}`
  ].join("\n");
  await sendResendEmail({
    to: [row.email_client.trim()],
    subject,
    text,
    event: "notify_client_booking_rescheduled_failed",
    context: { programareId, clientEmail: row.email_client.trim() }
  });
}

export async function notifyClientReminder(programareId: string, tip: "24h" | "2h"): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const admin = createSupabaseServiceClient();
  const { data: row } = await admin
    .from("programari")
    .select("nume_client, email_client, data_start, profesionisti(nume_business), servicii(nume)")
    .eq("id", programareId)
    .maybeSingle();

  if (!row?.email_client) return false;

  const relProf = row.profesionisti as { nume_business?: string | null } | { nume_business?: string | null }[] | null;
  const relServ = row.servicii as { nume?: string } | { nume?: string }[] | null;
  const profesionist = Array.isArray(relProf) ? relProf[0] ?? null : relProf;
  const serviciu = Array.isArray(relServ) ? relServ[0] ?? null : relServ;

  const salonName = profesionist?.nume_business?.trim() || "salon";
  const startsAt = new Date(String(row.data_start));
  const dataStr = formatInTimeZone(startsAt, TZ, "dd.MM.yyyy");
  const timeStr = formatInTimeZone(startsAt, TZ, "HH:mm");
  const subject = tip === "24h" ? `Reminder: ai programare mâine la ${salonName}` : `Reminder: ai programare în curând la ${salonName}`;
  const text = [
    `Salut ${row.nume_client},`,
    "",
    `Acesta este un reminder pentru programarea ta la ${salonName}.`,
    `Serviciu: ${serviciu?.nume ?? "serviciu"}`,
    `Data: ${dataStr}`,
    `Ora: ${timeStr}`
  ].join("\n");

  try {
    await sendResendEmail({
      to: [row.email_client.trim()],
      subject,
      text,
      event: "notify_client_reminder_failed",
      context: { programareId, tip, clientEmail: row.email_client.trim() }
    });

    return true;
  } catch (e) {
    reportError("email", "notify_client_reminder_failed", e, { programareId, tip });
    return false;
  }
}

type ProfesionistStatusSource = "client" | "salon" | "system";

export async function notifyProfesionistStatusUpdate(
  programareId: string,
  status: "confirmat" | "anulat",
  source: ProfesionistStatusSource
): Promise<void> {
  const admin = createSupabaseServiceClient();
  const { data: row, error } = await admin
    .from("programari")
    .select("nume_client, telefon_client, data_start, profesionisti(email_contact), servicii(nume)")
    .eq("id", programareId)
    .maybeSingle();

  if (error || !row) {
    return;
  }

  const relProf = row.profesionisti as { email_contact: string | null } | { email_contact: string | null }[] | null;
  const relServ = row.servicii as { nume: string } | { nume: string }[] | null;
  const profesionist = Array.isArray(relProf) ? relProf[0] ?? null : relProf;
  const serviciu = Array.isArray(relServ) ? relServ[0] ?? null : relServ;

  const to = profesionist?.email_contact?.trim();
  if (!to) {
    return;
  }

  const dataStr = formatInTimeZone(new Date(row.data_start), TZ, "dd.MM.yyyy");
  const timeStr = formatInTimeZone(new Date(row.data_start), TZ, "HH:mm");
  const actor = source === "client" ? "Clientul" : source === "salon" ? "Salonul" : "Sistemul";
  const actionVerb = status === "confirmat" ? "confirmat" : "anulat";
  const statusLabel = status === "confirmat" ? "confirmată" : "anulată";
  const subject = `${actor} a ${actionVerb} programarea`;
  const text = [
    `Programarea pentru ${serviciu?.nume ?? "Serviciu"} din ${dataStr}, ora ${timeStr} a fost ${statusLabel}.`,
    "",
    `Client: ${row.nume_client}`,
    `Telefon: ${row.telefon_client}`
  ].join("\n");

  await sendResendEmail({
    to: [to],
    subject,
    text,
    event: "notify_profesionist_status_update_failed",
    context: { programareId, status, source, to }
  });
}

export async function notifyProfesionistClientResponse(programareId: string, status: "confirmat" | "anulat"): Promise<void> {
  await notifyProfesionistStatusUpdate(programareId, status, "client");
}
