import { formatInTimeZone } from "date-fns-tz";

import { createBookingConfirmationLink } from "@/lib/booking/confirmation-link";
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

/**
 * Notificare salon după programare nouă (Resend).
 * Fără RESEND_API_KEY emailul nu se trimite.
 */
export async function notifyProfesionistNewProgramare(input: ProgramareNotifyInput): Promise<void> {
  const dataStr = formatInTimeZone(input.appointmentStart, TZ, "dd.MM.yyyy");
  const timeStr = formatInTimeZone(input.appointmentStart, TZ, "HH:mm");
  const subject = `Rezervare nouă - ${input.clientName}`;
  const text = `${input.clientName} (${input.clientPhone}) a rezervat ${input.serviceName} pe ${dataStr} la ${timeStr}`;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("RESEND_API_KEY lipsă - emailul nu a fost trimis");
    return;
  }

  const dest = input.to?.trim();
  if (!dest) {
    return;
  }

  const from = process.env.RESEND_FROM;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [dest],
        subject,
        text
      })
    });
    if (!res.ok) {
      const b = await res.text().catch(() => "");
      console.error("[notifyProfesionistNewProgramare] Resend", res.status, b);
    }
  } catch (e) {
    console.error("[notifyProfesionistNewProgramare]", e);
  }
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

  const from = process.env.RESEND_FROM;
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

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [clientEmail],
        subject,
        text
      })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[notifyClientBookingConfirmation] Resend", res.status, body);
    }
  } catch (e) {
    console.error("[notifyClientBookingConfirmation]", e);
  }
}

export async function notifyClientBookingCancelledBySalon(programareId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

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
  const from = process.env.RESEND_FROM;

  const subject = `Actualizare programare la ${salonName}`;
  const text = [
    `Salut ${row.nume_client},`,
    "",
    `Programarea ta pentru ${serviciu?.nume ?? "serviciu"} din ${dataStr}, ora ${timeStr}, a fost anulată de salon.`,
    "",
    "Dacă dorești, poți face o nouă rezervare folosind pagina salonului."
  ].join("\n");

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [row.email_client.trim()],
      subject,
      text
    })
  }).catch(() => undefined);
}

export async function notifyClientBookingRescheduledBySalon(programareId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

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
  const from = process.env.RESEND_FROM;
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

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [row.email_client.trim()],
      subject,
      text
    })
  }).catch(() => undefined);
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
  const from = process.env.RESEND_FROM;

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
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [row.email_client.trim()],
        subject,
        text
      })
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[notifyClientReminder] Resend", res.status, body);
      return false;
    }

    return true;
  } catch (e) {
    console.error("[notifyClientReminder]", e);
    return false;
  }
}

export async function notifyProfesionistClientResponse(programareId: string, status: "confirmat" | "anulat"): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return;
  }

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
  const statusLabel = status === "confirmat" ? "confirmată" : "anulată";
  const subject = `Clientul a ${status === "confirmat" ? "confirmat" : "anulat"} programarea`;
  const text = [
    `Programarea pentru ${serviciu?.nume ?? "Serviciu"} din ${dataStr}, ora ${timeStr} a fost ${statusLabel} de client.`,
    "",
    `Client: ${row.nume_client}`,
    `Telefon: ${row.telefon_client}`
  ].join("\n");

  const from = process.env.RESEND_FROM;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text
      })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[notifyProfesionistClientResponse] Resend", res.status, body);
    }
  } catch (e) {
    console.error("[notifyProfesionistClientResponse]", e);
  }
}
