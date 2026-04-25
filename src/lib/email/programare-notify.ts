import { formatInTimeZone } from "date-fns-tz";

import { createBookingConfirmationLink } from "@/lib/booking/confirmation-link";
import { reportError } from "@/lib/observability";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

const TZ = "Europe/Bucharest";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

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
  html?: string;
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
      text: input.text,
      html: input.html
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

  const salonName = profesionist?.nume_business?.trim() || "acest furnizor";
  const serviceName = serviciu?.nume?.trim() || "serviciu";
  const safeClientName = escapeHtml(String(row.nume_client));
  const safeSalonName = escapeHtml(salonName);
  const safeServiceName = escapeHtml(serviceName);
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
    "Deschide emailul în format HTML pentru butoanele Confirmă / Anulează.",
    "",
    "Dacă nu ai făcut tu această rezervare, poți ignora acest email."
  ].join("\n");

  const html = `
  <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;max-width:560px;margin:0 auto;">
    <h2 style="margin:0 0 12px;">Confirmă programarea</h2>
    <p style="margin:0 0 12px;">Salut ${safeClientName},</p>
    <p style="margin:0 0 16px;">Ai o programare la <strong>${safeSalonName}</strong> pentru <strong>${safeServiceName}</strong> pe <strong>${dataStr}</strong> la <strong>${timeStr}</strong>.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:0 0 16px;">
      <a href="${confirmLink}" style="background:#16a34a;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:700;display:inline-block;">Confirmă</a>
      <a href="${cancelLink}" style="background:#dc2626;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:700;display:inline-block;">Anulează</a>
    </div>
    <p style="margin:0;color:#6b7280;font-size:13px;">Dacă nu ai făcut tu această rezervare, poți ignora acest email.</p>
  </div>`;

  await sendResendEmail({
    to: [clientEmail],
    subject,
    text,
    html,
    event: "notify_client_booking_confirmation_failed",
    context: { clientEmail, bookingId: row.id }
  });
}

export async function notifyClientBookingCancelledByProvider(programareId: string): Promise<void> {
  const admin = createSupabaseServiceClient();
  const { data: row } = await admin
    .from("programari")
    .select("nume_client, email_client, data_start, profesionisti(nume_business, slug), servicii(nume)")
    .eq("id", programareId)
    .maybeSingle();

  if (!row?.email_client) return;

  const relProf = row.profesionisti as { nume_business?: string | null; slug?: string | null } | { nume_business?: string | null; slug?: string | null }[] | null;
  const relServ = row.servicii as { nume?: string } | { nume?: string }[] | null;
  const profesionist = Array.isArray(relProf) ? relProf[0] ?? null : relProf;
  const serviciu = Array.isArray(relServ) ? relServ[0] ?? null : relServ;

  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://ocupaloc.ro").replace(/\/$/, "");
  const salonName = profesionist?.nume_business?.trim() || "acest furnizor";
  const rebookUrl = profesionist?.slug ? `${SITE_URL}/${profesionist.slug}` : null;
  const dataStr = formatInTimeZone(new Date(String(row.data_start)), TZ, "dd.MM.yyyy");
  const timeStr = formatInTimeZone(new Date(String(row.data_start)), TZ, "HH:mm");
  const subject = `Actualizare programare la ${salonName}`;
  const text = [
    `Salut ${row.nume_client},`,
    "",
    `Programarea ta pentru ${serviciu?.nume ?? "serviciu"} din ${dataStr}, ora ${timeStr}, a fost anulată de prestator.`,
    "",
    rebookUrl ? `Poți face o nouă rezervare online: ${rebookUrl}` : "Dacă dorești, poți face o nouă rezervare folosind pagina de rezervare."
  ].join("\n");

  const html = `
<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:560px;margin:0 auto;">
  <h2 style="margin:0 0 8px;">Programare anulată</h2>
  <p style="margin:0 0 12px;">Salut <strong>${escapeHtml(String(row.nume_client))}</strong>,</p>
  <p style="margin:0 0 16px;">Programarea ta pentru <strong>${escapeHtml(serviciu?.nume ?? "serviciu")}</strong> din <strong>${escapeHtml(dataStr)}</strong> la ora <strong>${escapeHtml(timeStr)}</strong> a fost anulată de prestator.</p>
  ${rebookUrl ? `<p style="margin:0 0 12px;">Poți face o nouă rezervare oricând:</p>
  <a href="${rebookUrl}" style="background:#1c1c2e;color:#fbbf24;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;display:inline-block;margin:0 0 20px;">Rezervă din nou →</a>` : ""}
  <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;">OcupaLoc · ocupaloc.ro</p>
</div>`;

  await sendResendEmail({
    to: [row.email_client.trim()],
    subject,
    text,
    html,
    event: "notify_client_booking_cancelled_failed",
    context: { programareId, clientEmail: row.email_client.trim() }
  });
}

export async function notifyClientBookingRescheduledByProvider(programareId: string): Promise<void> {
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

  const salonName = profesionist?.nume_business?.trim() || "acest furnizor";
  const dataStr = formatInTimeZone(new Date(String(row.data_start)), TZ, "dd.MM.yyyy");
  const timeStr = formatInTimeZone(new Date(String(row.data_start)), TZ, "HH:mm");
  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://ocupaloc.ro").replace(/\/$/, "");
  const rebookUrl = profesionist?.slug ? `${SITE_URL}/${profesionist.slug}` : null;
  const serviceName = serviciu?.nume?.trim() || "serviciu";

  const subject = `Programare reprogramată la ${salonName}`;
  const text = [
    `Salut ${row.nume_client},`,
    "",
    `Programarea ta pentru ${serviceName} a fost reprogramată de prestator.`,
    `Noua dată: ${dataStr}, ora ${timeStr}.`,
    "",
    rebookUrl ? `Detalii/Reprogramare: ${rebookUrl}` : ""
  ].filter(Boolean).join("\n");

  const html = `
<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:560px;margin:0 auto;">
  <h2 style="margin:0 0 8px;">Programare reprogramată</h2>
  <p style="margin:0 0 12px;">Salut <strong>${escapeHtml(String(row.nume_client))}</strong>,</p>
  <p style="margin:0 0 16px;">Programarea ta pentru <strong>${escapeHtml(serviceName)}</strong> la <strong>${escapeHtml(salonName)}</strong> a fost reprogramată de prestator.</p>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:0 0 20px;">
    <p style="margin:0 0 4px;"><strong>Noua dată:</strong> ${escapeHtml(dataStr)}</p>
    <p style="margin:0;"><strong>Ora:</strong> ${escapeHtml(timeStr)}</p>
  </div>
  ${rebookUrl ? `<a href="${rebookUrl}" style="background:#1c1c2e;color:#fbbf24;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;display:inline-block;margin:0 0 20px;">Vezi detalii →</a>` : ""}
  <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;">OcupaLoc · ocupaloc.ro</p>
</div>`;

  await sendResendEmail({
    to: [row.email_client.trim()],
    subject,
    text,
    html,
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

  const salonName = profesionist?.nume_business?.trim() || "acest furnizor";
  const startsAt = new Date(String(row.data_start));
  const dataStr = formatInTimeZone(startsAt, TZ, "dd.MM.yyyy");
  const timeStr = formatInTimeZone(startsAt, TZ, "HH:mm");
  const subject = tip === "24h" ? `Reminder: ai programare mâine la ${salonName}` : `Reminder: ai programare în curând la ${salonName}`;
  const serviceName = serviciu?.nume ?? "serviciu";

  const confirmUrl = tip === "24h" ? createBookingConfirmationLink({ bookingId: programareId, action: "confirm" }) : null;
  const cancelUrl = tip === "24h" ? createBookingConfirmationLink({ bookingId: programareId, action: "cancel" }) : null;

  const confirmBlock =
    confirmUrl && cancelUrl
      ? `\n\nConfirmă sau anulează:\n  ✓ Confirmă: ${confirmUrl}\n  ✗ Anulează: ${cancelUrl}`
      : "";

  const text = [
    `Salut ${row.nume_client},`,
    "",
    `Acesta este un reminder pentru programarea ta la ${salonName}.`,
    `Serviciu: ${serviceName}`,
    `Data: ${dataStr}`,
    `Ora: ${timeStr}${confirmBlock}`
  ].join("\n");

  let html: string | undefined;
  if (confirmUrl && cancelUrl) {
    html = `
<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:560px;margin:0 auto;">
  <h2 style="margin:0 0 8px;">Reminder programare 📅</h2>
  <p style="margin:0 0 16px;">Salut <strong>${escapeHtml(row.nume_client ?? "")}</strong>,</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:0 0 20px;">
    <p style="margin:0 0 4px;"><strong>Furnizor:</strong> ${escapeHtml(salonName)}</p>
    <p style="margin:0 0 4px;"><strong>Serviciu:</strong> ${escapeHtml(serviceName)}</p>
    <p style="margin:0 0 4px;"><strong>Data:</strong> ${escapeHtml(dataStr)}</p>
    <p style="margin:0;"><strong>Ora:</strong> ${escapeHtml(timeStr)}</p>
  </div>

  <p style="margin:0 0 12px;font-weight:600;">Confirmi că vii?</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;">
    <a href="${confirmUrl}" style="background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700;display:inline-block;margin:0 8px 8px 0;">✓ Confirmă prezența</a>
    <a href="${cancelUrl}" style="background:#f3f4f6;color:#374151;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700;display:inline-block;margin:0 0 8px;">✗ Anulează</a>
  </div>

  <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;">OcupaLoc · ocupaloc.ro</p>
</div>`;
  }

  try {
    await sendResendEmail({
      to: [row.email_client.trim()],
      subject,
      text,
      ...(html ? { html } : {}),
      event: "notify_client_reminder_failed",
      context: { programareId, tip, clientEmail: row.email_client.trim() }
    });

    return true;
  } catch (e) {
    reportError("email", "notify_client_reminder_failed", e, { programareId, tip });
    return false;
  }
}

export async function notifyClientPostCompletion(programareId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

  const admin = createSupabaseServiceClient();
  const { data: row } = await admin
    .from("programari")
    .select("nume_client, email_client, data_start, profesionisti(nume_business, slug), servicii(nume)")
    .eq("id", programareId)
    .maybeSingle();

  if (!row?.email_client) return;

  const relProf = row.profesionisti as { nume_business?: string | null; slug?: string | null } | { nume_business?: string | null; slug?: string | null }[] | null;
  const relServ = row.servicii as { nume?: string } | { nume?: string }[] | null;
  const profesionist = Array.isArray(relProf) ? relProf[0] ?? null : relProf;
  const serviciu = Array.isArray(relServ) ? relServ[0] ?? null : relServ;

  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://ocupaloc.ro").replace(/\/$/, "");
  const salonName = profesionist?.nume_business?.trim() || "acest furnizor";
  const rebookUrl = profesionist?.slug ? `${SITE_URL}/${profesionist.slug}` : null;
  const serviceName = serviciu?.nume?.trim() || "serviciu";
  const safeClientName = escapeHtml(String(row.nume_client));
  const safeSalonName = escapeHtml(salonName);
  const safeServiceName = escapeHtml(serviceName);

  const subject = `Mulțumim că ai ales ${salonName}!`;
  const text = [
    `Salut ${row.nume_client},`,
    "",
    `Mulțumim că ai ales ${salonName} pentru ${serviceName}. A fost o plăcere!`,
    "",
    rebookUrl ? `Rezervă din nou oricând: ${rebookUrl}` : ""
  ].filter(Boolean).join("\n");

  const html = `
<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:560px;margin:0 auto;">
  <h2 style="margin:0 0 8px;">Mulțumim! 🙏</h2>
  <p style="margin:0 0 12px;">Salut <strong>${safeClientName}</strong>,</p>
  <p style="margin:0 0 16px;">Mulțumim că ai ales <strong>${safeSalonName}</strong> pentru <strong>${safeServiceName}</strong>. A fost o plăcere să te avem!</p>
  ${rebookUrl ? `<p style="margin:0 0 12px;">Data viitoare ne poți rezerva la fel de simplu:</p>
  <a href="${rebookUrl}" style="background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700;display:inline-block;margin:0 0 20px;">Rezervă din nou →</a>` : ""}
  <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;">OcupaLoc · ocupaloc.ro</p>
</div>`;

  try {
    await sendResendEmail({
      to: [row.email_client.trim()],
      subject,
      text,
      html,
      event: "notify_client_post_completion_failed",
      context: { programareId, clientEmail: row.email_client.trim() }
    });
  } catch (e) {
    reportError("email", "notify_client_post_completion_failed", e, { programareId });
  }
}

export async function notifyProfesionistClientResponse(programareId: string, status: "confirmat" | "anulat"): Promise<void> {
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

  await sendResendEmail({
    to: [to],
    subject,
    text,
    event: "notify_profesionist_client_response_failed",
    context: { programareId, status, to }
  });
}
