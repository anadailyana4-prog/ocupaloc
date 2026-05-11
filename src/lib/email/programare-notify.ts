import { formatInTimeZone } from "date-fns-tz";

import { createBookingConfirmationLink } from "@/lib/booking/confirmation-link";
import { generateCancellationPolicy } from "@/lib/booking/cancellation-policy";
import { enqueueEmail } from "@/lib/email/email-queue";
import { sendResendEmail } from "@/lib/email/resend";
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
  /** profesionisti.email */
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
    .select("nume_client, telefon_client, data_start, profesionisti(email), servicii(nume)")
    .eq("id", programareId)
    .maybeSingle();

  if (error || !row) {
    console.error("[notifyProfesionistDespreProgramare] programare lipsa:", error?.message ?? "not found");
    return { profesionistEmail: null };
  }

  const relProf = row.profesionisti as { email: string | null } | { email: string | null }[] | null;
  const relServ = row.servicii as { nume: string } | { nume: string }[] | null;
  const profesionist = Array.isArray(relProf) ? relProf[0] ?? null : relProf;
  const serviciu = Array.isArray(relServ) ? relServ[0] ?? null : relServ;

  const dataStr = formatInTimeZone(new Date(row.data_start), TZ, "dd.MM.yyyy");
  const timeStr = formatInTimeZone(new Date(row.data_start), TZ, "HH:mm");
  const subject = `Rezervare noua - ${row.nume_client}`;
  const text = `${row.nume_client} (${row.telefon_client}) a rezervat ${serviciu?.nume ?? "Serviciu"} pe ${dataStr} la ${timeStr}`;

  const to = profesionist?.email?.trim();
  if (to) {
    await enqueueEmail({
      template: "booking_pro_new",
      toEmail: to,
      subject,
      payload: { text }
    });
  }

  return { profesionistEmail: profesionist?.email ?? null };
}

export async function notifyClientBookingConfirmation(programareId: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return false;
  }

  const admin = createSupabaseServiceClient();
  const { data: row, error } = await admin
    .from("programari")
    .select("id, nume_client, email_client, data_start, profesionisti(slug, nume_business), servicii(nume)")
    .eq("id", programareId)
    .maybeSingle();

  if (error || !row) {
    return false;
  }

  const clientEmail = row.email_client?.trim();
  if (!clientEmail) {
    return false;
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
  const cancellationPolicy = generateCancellationPolicy(60); // Default 60 days

  const subject = `Rezervare confirmată la ${salonName}`;
  const text = [
    `Salut ${row.nume_client},`,
    "",
    `Rezervarea ta la ${salonName} pentru ${serviceName} pe ${dataStr} la ${timeStr} a fost înregistrată.`,
    "",
    "Poți confirma sau anula direct din linkurile de mai jos:",
    `Confirmă prezența: ${confirmLink}`,
    `Anulează programarea: ${cancelLink}`,
    "",
    cancellationPolicy,
    "",
    "Dacă nu ai făcut tu această rezervare, poți ignora acest email."
  ].join("\n");

  const html = `
  <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;max-width:560px;margin:0 auto;">
    <h2 style="margin:0 0 12px;">Rezervare confirmată ✓</h2>
    <p style="margin:0 0 12px;">Salut ${safeClientName},</p>
    <p style="margin:0 0 16px;">Rezervarea ta la <strong>${safeSalonName}</strong> pentru <strong>${safeServiceName}</strong> pe <strong>${dataStr}</strong> la <strong>${timeStr}</strong> a fost înregistrată.</p>
    <p style="margin:0 0 12px;color:#374151;">Poți confirma sau anula chiar acum:</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:0 0 16px;">
      <a href="${confirmLink}" style="background:#16a34a;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:700;display:inline-block;">Confirmă prezența</a>
      <a href="${cancelLink}" style="background:#f3f4f6;color:#374151;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:700;display:inline-block;">Anulează programarea</a>
    </div>
    <p style="margin:0 0 12px;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;padding-top:12px;"><em>${escapeHtml(cancellationPolicy)}</em></p>
    <p style="margin:0;color:#6b7280;font-size:13px;">Dacă nu ai făcut tu această rezervare, poți ignora acest email. Reminderul automat rămâne activ înainte de programare.</p>
  </div>`;

  await enqueueEmail({
    template: "booking_client_confirmation",
    toEmail: clientEmail,
    subject,
    payload: { text, html }
  });

  return true;
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

  await enqueueEmail({
    template: "booking_client_cancelled",
    toEmail: row.email_client.trim(),
    subject,
    payload: { text, html }
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

  await enqueueEmail({
    template: "booking_client_rescheduled",
    toEmail: row.email_client.trim(),
    subject,
    payload: { text, html }
  });
}

export async function notifyClientReminder(programareId: string, tip: "24h" | "2h" | "morning"): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const admin = createSupabaseServiceClient();
  const { data: row } = await admin
    .from("programari")
    .select("nume_client, email_client, data_start, profesionisti(nume_business, adresa_publica, lucreaza_acasa), servicii(nume)")
    .eq("id", programareId)
    .maybeSingle();

  if (!row?.email_client) return false;

  const relProf = row.profesionisti as
    | { nume_business?: string | null; adresa_publica?: string | null; lucreaza_acasa?: boolean | null }
    | { nume_business?: string | null; adresa_publica?: string | null; lucreaza_acasa?: boolean | null }[]
    | null;
  const relServ = row.servicii as { nume?: string } | { nume?: string }[] | null;
  const profesionist = Array.isArray(relProf) ? relProf[0] ?? null : relProf;
  const serviciu = Array.isArray(relServ) ? relServ[0] ?? null : relServ;

  const salonName = profesionist?.nume_business?.trim() || "acest furnizor";
  const startsAt = new Date(String(row.data_start));
  const dataStr = formatInTimeZone(startsAt, TZ, "dd.MM.yyyy");
  const timeStr = formatInTimeZone(startsAt, TZ, "HH:mm");
  const subject = tip === "24h" ? `Reminder: ai programare mâine la ${salonName}` : `Reminder: ai programare în curând la ${salonName}`;
  const serviceName = serviciu?.nume ?? "serviciu";
  const publicAddress = profesionist?.adresa_publica?.trim() || "";
  const locationNote = publicAddress
    ? `Locație: ${publicAddress}`
    : profesionist?.lucreaza_acasa
      ? "Locație: adresa exactă se comunică direct de profesionist."
      : "";

  const confirmUrl = tip === "24h" ? createBookingConfirmationLink({ bookingId: programareId, action: "confirm" }) : null;
  const rescheduleUrl = tip === "24h" ? createBookingConfirmationLink({ bookingId: programareId, action: "reschedule" }) : null;
  const cancelUrl = tip === "24h" ? createBookingConfirmationLink({ bookingId: programareId, action: "cancel" }) : null;

  const textLines = [
    `Salut ${row.nume_client},`,
    "",
    `Acesta este un reminder pentru programarea ta la ${salonName}.`,
    `Business: ${salonName}`,
    `Serviciu: ${serviceName}`,
    `Data: ${dataStr}`,
    `Ora: ${timeStr}`,
    ...(locationNote ? [locationNote] : [])
  ];

  if (confirmUrl && rescheduleUrl && cancelUrl) {
    textLines.push(
      "",
      "Confirmă, reprogramează sau anulează:",
      `Confirmă prezența: ${confirmUrl}`,
      `Reprogramează: ${rescheduleUrl}`,
      `Anulează programarea: ${cancelUrl}`
    );
  }

  const text = textLines.join("\n");

  let html: string | undefined;
  if (confirmUrl && rescheduleUrl && cancelUrl) {
    html = `
<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:560px;margin:0 auto;">
  <h2 style="margin:0 0 8px;">Reminder programare 📅</h2>
  <p style="margin:0 0 16px;">Salut <strong>${escapeHtml(row.nume_client ?? "")}</strong>,</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:0 0 20px;">
    <p style="margin:0 0 4px;"><strong>Business:</strong> ${escapeHtml(salonName)}</p>
    <p style="margin:0 0 4px;"><strong>Serviciu:</strong> ${escapeHtml(serviceName)}</p>
    <p style="margin:0 0 4px;"><strong>Data:</strong> ${escapeHtml(dataStr)}</p>
    <p style="margin:0;"><strong>Ora:</strong> ${escapeHtml(timeStr)}</p>
    ${locationNote ? `<p style="margin:4px 0 0;"><strong>Locație:</strong> ${escapeHtml(publicAddress || "Adresa exactă se comunică direct de profesionist.")}</p>` : ""}
  </div>

  <p style="margin:0 0 12px;font-weight:600;">Confirmi că vii?</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;">
    <a href="${confirmUrl}" style="background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700;display:inline-block;margin:0 8px 8px 0;">✓ Confirmă prezența</a>
    <a href="${rescheduleUrl}" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700;display:inline-block;margin:0 8px 8px 0;">↻ Reprogramează</a>
    <a href="${cancelUrl}" style="background:#f3f4f6;color:#374151;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700;display:inline-block;margin:0 0 8px;">✗ Anulează programarea</a>
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

export function buildPostCompletionEmail(input: {
  clientName: string;
  salonName: string;
  serviceName: string;
  rebookUrl?: string | null;
  googleReviewUrl?: string | null;
}): { subject: string; text: string; html: string } {
  const safeClientName = escapeHtml(input.clientName);
  const safeSalonName = escapeHtml(input.salonName);
  const safeServiceName = escapeHtml(input.serviceName);
  const reviewText = input.googleReviewUrl?.trim()
    ? `Daca ai fost multumit(a), ne ajuta enorm un review Google: ${input.googleReviewUrl.trim()}`
    : "";

  const subject = `Mulțumim că ai ales ${input.salonName}!`;
  const text = [
    `Salut ${input.clientName},`,
    "",
    `Mulțumim că ai ales ${input.salonName} pentru ${input.serviceName}. A fost o plăcere!`,
    "",
    reviewText,
    input.rebookUrl ? `Rezervă din nou oricând: ${input.rebookUrl}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:560px;margin:0 auto;">
  <h2 style="margin:0 0 8px;">Mulțumim! 🙏</h2>
  <p style="margin:0 0 12px;">Salut <strong>${safeClientName}</strong>,</p>
  <p style="margin:0 0 16px;">Mulțumim că ai ales <strong>${safeSalonName}</strong> pentru <strong>${safeServiceName}</strong>. A fost o plăcere să te avem!</p>
  ${
    input.googleReviewUrl?.trim()
      ? `<p style="margin:0 0 10px;">Dacă ai fost mulțumit(ă), ne ajuți enorm cu un review:</p>
  <a href="${escapeHtml(input.googleReviewUrl.trim())}" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700;display:inline-block;margin:0 0 14px;">Lasă review pe Google →</a>`
      : ""
  }
  ${
    input.rebookUrl
      ? `<p style="margin:0 0 12px;">Data viitoare ne poți rezerva la fel de simplu:</p>
  <a href="${input.rebookUrl}" style="background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700;display:inline-block;margin:0 0 20px;">Rezervă din nou →</a>`
      : ""
  }
  <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;">OcupaLoc · ocupaloc.ro</p>
</div>`;

  return { subject, text, html };
}

export async function notifyClientPostCompletion(programareId: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const admin = createSupabaseServiceClient();
  const { data: row } = await admin
    .from("programari")
    .select("nume_client, email_client, data_start, profesionisti(nume_business, slug, google_review_url), servicii(nume)")
    .eq("id", programareId)
    .maybeSingle();

  if (!row?.email_client) return false;

  const relProf = row.profesionisti as
    | { nume_business?: string | null; slug?: string | null; google_review_url?: string | null }
    | { nume_business?: string | null; slug?: string | null; google_review_url?: string | null }[]
    | null;
  const relServ = row.servicii as { nume?: string } | { nume?: string }[] | null;
  const profesionist = Array.isArray(relProf) ? relProf[0] ?? null : relProf;
  const serviciu = Array.isArray(relServ) ? relServ[0] ?? null : relServ;

  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://ocupaloc.ro").replace(/\/$/, "");
  const salonName = profesionist?.nume_business?.trim() || "acest furnizor";
  const rebookUrl = profesionist?.slug ? `${SITE_URL}/${profesionist.slug}` : null;
  const serviceName = serviciu?.nume?.trim() || "serviciu";
  const built = buildPostCompletionEmail({
    clientName: String(row.nume_client),
    salonName,
    serviceName,
    rebookUrl,
    googleReviewUrl: profesionist?.google_review_url ?? null
  });

  try {
    await sendResendEmail({
      to: [row.email_client.trim()],
      subject: built.subject,
      text: built.text,
      html: built.html,
      event: "notify_client_post_completion_failed",
      context: { programareId, clientEmail: row.email_client.trim() }
    });
    return true;
  } catch (e) {
    reportError("email", "notify_client_post_completion_failed", e, { programareId });
    return false;
  }
}

export async function notifyProfesionistClientResponse(programareId: string, status: "confirmat" | "anulat"): Promise<void> {
  const admin = createSupabaseServiceClient();
  const { data: row, error } = await admin
    .from("programari")
    .select("nume_client, telefon_client, data_start, profesionisti(email), servicii(nume)")
    .eq("id", programareId)
    .maybeSingle();

  if (error || !row) {
    return;
  }

  const relProf = row.profesionisti as { email: string | null } | { email: string | null }[] | null;
  const relServ = row.servicii as { nume: string } | { nume: string }[] | null;
  const profesionist = Array.isArray(relProf) ? relProf[0] ?? null : relProf;
  const serviciu = Array.isArray(relServ) ? relServ[0] ?? null : relServ;

  const to = profesionist?.email?.trim();
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

export async function notifyClientBookingRescheduled(programareId: string): Promise<void> {
  const admin = createSupabaseServiceClient();
  const { data: row, error } = await admin
    .from("programari")
    .select("email_client, nume_client, data_start, servicii(nume)")
    .eq("id", programareId)
    .maybeSingle();

  if (error || !row?.email_client) {
    reportError("email", "notify_client_rescheduled_fetch_failed", error, { programareId });
    return;
  }

  const serviciu = Array.isArray(row.servicii) ? row.servicii[0] ?? null : row.servicii;
  const dataStr = formatInTimeZone(new Date(row.data_start), TZ, "dd.MM.yyyy");
  const timeStr = formatInTimeZone(new Date(row.data_start), TZ, "HH:mm");
  const subject = "Programarea ta a fost reprogramată ✓";
  const text = [
    `Salut ${row.nume_client},`,
    "",
    `Programarea pentru ${serviciu?.nume ?? "Serviciu"} a fost reprogramată cu succes.`,
    "",
    `Noua dată și oră: ${dataStr}, ora ${timeStr}`,
    "",
    "Mulțumim!"
  ].join("\n");

  await sendResendEmail({
    to: [row.email_client],
    subject,
    text,
    event: "notify_client_rescheduled_failed",
    context: { programareId, to: row.email_client }
  });
}
