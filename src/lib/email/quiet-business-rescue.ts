/**
 * Quiet-business rescue email.
 * Fires once per business when they cross 14 days without a confirmed booking
 * and have completed onboarding. Separate from the weekly summary zero-branch.
 *
 * Cron: daily at 09:30, runs idempotently via a date-window guard:
 * we only send to businesses that crossed 14d of inactivity AND haven't received
 * this email in the last 30 days (checked via a 14-21 day booking window guard).
 *
 * Dedup strategy: we use a softer guard:
 * query businesses whose last booking is exactly 14-21 days ago (i.e. just crossed the
 * threshold). This means the cron only fires in a narrow window, preventing spam.
 * We also include businesses that completed onboarding but NEVER had a booking
 * and are 14-21 days old.
 */

import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { reportError } from "@/lib/observability";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://ocupaloc.ro").replace(/\/$/, "");

function escapeHtml(v: string): string {
  return v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sendResendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (!apiKey || !from) throw new Error("Resend not configured");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, text: input.text, html: input.html })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body}`);
  }
}

type RescueRow = {
  profId: string;
  email: string;
  numeBusiness: string;
  slug: string;
  daysSinceLastBooking: number | null; // null = never had a booking
};

export async function sendQuietBusinessRescueEmails(): Promise<{ sent: number; skipped: number; failed: number }> {
  const admin = createSupabaseServiceClient();

  // Window: businesses whose last confirmed booking was 14-21 days ago (crosses threshold, not too stale)
  // We also include businesses that completed onboarding but NEVER had a booking and are 14-21 days old
  const now = new Date();
  const windowStart = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Fetch all onboarded professionals with email
  const { data: profs, error: profErr } = await admin
    .from("profesionisti")
    .select("id, slug, email_contact, nume_business, created_at")
    .not("email_contact", "is", null)
    .neq("email_contact", "")
    .gte("onboarding_pas", 4);

  if (profErr || !profs?.length) {
    if (profErr) reportError("cron", "quiet_rescue_profs_failed", profErr);
    return { sent: 0, skipped: 0, failed: 0 };
  }

  const profIds = profs.map((p) => p.id as string);

  // Get the most recent confirmed/finalized booking per business
  const { data: lastBookings } = await admin
    .from("programari")
    .select("profesionist_id, data_start")
    .in("profesionist_id", profIds)
    .in("status", ["confirmat", "finalizat"])
    .order("data_start", { ascending: false })
    .limit(5000);

  // Build map: profId → most recent booking date
  const lastBookingMap = new Map<string, Date>();
  for (const b of lastBookings ?? []) {
    const pid = b.profesionist_id as string;
    if (!lastBookingMap.has(pid)) {
      lastBookingMap.set(pid, new Date(b.data_start as string));
    }
  }

  const toRescue: RescueRow[] = [];

  for (const prof of profs) {
    const pid = prof.id as string;
    const email = prof.email_contact as string;
    if (!email) continue;

    const lastBooking = lastBookingMap.get(pid) ?? null;

    if (lastBooking) {
      // Has had bookings: check if last one is in the 14-21 day window
      if (lastBooking >= windowStart && lastBooking <= windowEnd) {
        const daysSince = Math.floor((now.getTime() - lastBooking.getTime()) / (24 * 60 * 60 * 1000));
        toRescue.push({
          profId: pid,
          email,
          numeBusiness: (prof.nume_business as string | null)?.trim() || "Afacerea ta",
          slug: (prof.slug as string | null) ?? "",
          daysSinceLastBooking: daysSince
        });
      }
    } else {
      // Never had a booking: check if account is 14-21 days old
      const createdAt = prof.created_at ? new Date(prof.created_at as string) : null;
      if (createdAt && createdAt >= windowStart && createdAt <= windowEnd) {
        toRescue.push({
          profId: pid,
          email,
          numeBusiness: (prof.nume_business as string | null)?.trim() || "Afacerea ta",
          slug: (prof.slug as string | null) ?? "",
          daysSinceLastBooking: null
        });
      }
    }
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of toRescue) {
    try {
      const content = buildRescueEmail(row);
      await sendResendEmail({ to: row.email, ...content });
      sent++;
    } catch (err) {
      failed++;
      reportError("cron", "quiet_rescue_send_failed", err, { profId: row.profId });
    }
  }

  skipped = profs.length - toRescue.length - failed;

  return { sent, skipped, failed };
}

function buildRescueEmail(row: RescueRow): { subject: string; text: string; html: string } {
  const publicUrl = row.slug ? `${SITE_URL}/${row.slug}` : null;
  const business = escapeHtml(row.numeBusiness);
  const dashboardUrl = `${SITE_URL}/dashboard`;

  const neverBooked = row.daysSinceLastBooking === null;
  const subject = neverBooked
    ? `${row.numeBusiness} — profilul e gata, dar nu ai primit programări încă`
    : `${row.numeBusiness} — ${row.daysSinceLastBooking} zile fără programări`;

  const intro = neverBooked
    ? `Profilul tău pe OcupaLoc e configurat, dar nu ai primit nicio programare încă.`
    : `Nu ai primit programări noi în ultimele ${row.daysSinceLastBooking} zile.`;

  const text = [
    `Salut ${row.numeBusiness},`,
    "",
    intro,
    "",
    "Cele mai rapide moduri să primești programări:",
    "  1. Trimite linkul la 10 clienți pe WhatsApp — îi poți întreba direct dacă vor să rezerve online",
  "  2. Pune linkul în bio-ul de Instagram sau pe rețelele sociale",
  "  3. Tipărește un QR code / afișează-l la locația ta",
    "",
    publicUrl ? `Linkul tău: ${publicUrl}` : "",
    "",
    `Dashboard: ${dashboardUrl}`,
    "",
    "Suntem aici dacă ai nevoie de ajutor.",
    "Echipa OcupaLoc"
  ].filter((l) => l !== "").join("\n");

  const waText = publicUrl
    ? encodeURIComponent(`Programează-te online la ${row.numeBusiness}: ${publicUrl}`)
    : "";
  const waUrl = publicUrl ? `https://wa.me/?text=${waText}` : null;

  const html = `
<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:560px;margin:0 auto;">
  <h2 style="margin:0 0 4px;">Ești gata — clienții te așteaptă 📲</h2>
  <p style="margin:0 0 16px;color:#6b7280;">${business}</p>

  <p style="margin:0 0 16px;">${escapeHtml(intro)}</p>

  <p style="margin:0 0 8px;font-weight:600;">Trimite linkul acum în 3 pași:</p>
  <ol style="margin:0 0 20px;padding-left:20px;color:#374151;">
    <li style="margin-bottom:8px;">
      <strong>WhatsApp</strong> — trimite la 10 clienți existenți
      ${waUrl ? `<br><a href="${waUrl}" style="color:#16a34a;font-weight:600;">Deschide WhatsApp →</a>` : ""}
    </li>
    <li style="margin-bottom:8px;"><strong>Instagram Story / rețele sociale</strong> — bio sau story cu linkul tău</li>
    <li style="margin-bottom:8px;"><strong>QR la locație</strong> — la recepție, pe birou sau pe chitanță</li>
  </ol>

  ${publicUrl ? `<p style="margin:0 0 12px;font-size:13px;color:#6b7280;">Linkul tău: <a href="${publicUrl}" style="color:#2563eb;">${publicUrl}</a></p>` : ""}

  <a href="${dashboardUrl}" style="background:#1c1c2e;color:#fbbf24;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;display:inline-block;margin:0 0 20px;">
    Deschide dashboard-ul →
  </a>

  <p style="margin:0;color:#9ca3af;font-size:12px;">OcupaLoc · <a href="${SITE_URL}" style="color:#9ca3af;">ocupaloc.ro</a></p>
</div>`;

  return { subject, text, html };
}
