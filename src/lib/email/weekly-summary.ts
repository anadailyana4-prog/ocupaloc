import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { reportError } from "@/lib/observability";
import { ziKeyFromDate } from "@/lib/program";

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
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, text: input.text, html: input.html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body}`);
  }
}

type WeeklySummaryRow = {
  profId: string;
  slug: string;
  email: string;
  numeBusiness: string;
  bookingsThisWeek: number;
  bookingsPrevWeek: number;
  topService: string | null;
  upcomingNext7: number;
  noShowCount: number;
  cancellationCount: number;
  daysSinceLastBooking: number | null; // null = never had a booking
  utilizationPct: number | null; // booked minutes / scheduled minutes * 100
};

async function buildWeeklySummaries(): Promise<WeeklySummaryRow[]> {
  const admin = createSupabaseServiceClient();

  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const next7End = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Fetch all active professionals with email and schedule
  const { data: profs, error: profErr } = await admin
    .from("profesionisti")
    .select("id, slug, email_contact, nume_business, program")
    .not("email_contact", "is", null)
    .neq("email_contact", "")
    .order("id");

  if (profErr || !profs?.length) {
    if (profErr) reportError("cron", "weekly_summary_profs_failed", profErr);
    return [];
  }

  const profIds = profs.map((p) => p.id as string);

  // Fetch this week's confirmed bookings (with duration for utilization)
  const { data: thisWeekRows } = await admin
    .from("programari")
    .select("profesionist_id, data_start, data_final, servicii(nume)")
    .in("profesionist_id", profIds)
    .in("status", ["confirmat", "finalizat"])
    .gte("data_start", weekStart.toISOString())
    .lt("data_start", now.toISOString());

  // Fetch previous week confirmed bookings (count only)
  const { data: prevWeekRows } = await admin
    .from("programari")
    .select("profesionist_id")
    .in("profesionist_id", profIds)
    .in("status", ["confirmat", "finalizat"])
    .gte("data_start", prevWeekStart.toISOString())
    .lt("data_start", weekStart.toISOString());

  // Fetch upcoming next 7 days confirmed
  const { data: upcomingRows } = await admin
    .from("programari")
    .select("profesionist_id")
    .in("profesionist_id", profIds)
    .eq("status", "confirmat")
    .gte("data_start", now.toISOString())
    .lte("data_start", next7End.toISOString());

  // Fetch no-shows this week
  const { data: noShowRows } = await admin
    .from("programari")
    .select("profesionist_id")
    .in("profesionist_id", profIds)
    .eq("status", "noaparit")
    .gte("data_start", weekStart.toISOString())
    .lt("data_start", now.toISOString());

  // Fetch client cancellations this week
  const { data: cancellationRows } = await admin
    .from("programari_status_events")
    .select("profesionist_id")
    .in("profesionist_id", profIds)
    .eq("status", "anulat")
    .eq("source", "client_link")
    .gte("created_at", weekStart.toISOString())
    .lt("created_at", now.toISOString());

  // Fetch last confirmed/finalized booking per prof (for daysSinceLastBooking)
  const { data: lastBookingRows } = await admin
    .from("programari")
    .select("profesionist_id, data_start")
    .in("profesionist_id", profIds)
    .in("status", ["confirmat", "finalizat"])
    .lt("data_start", now.toISOString())
    .order("data_start", { ascending: false })
    .limit(profIds.length * 2);

  // Build per-prof counters
  const thisWeekCount: Record<string, number> = {};
  const prevWeekCount: Record<string, number> = {};
  const upcomingCount: Record<string, number> = {};
  const noShowWeekCount: Record<string, number> = {};
  const cancellationWeekCount: Record<string, number> = {};
  const lastBookingDateMap: Record<string, string> = {};
  const bookedMinutesMap: Record<string, number> = {};
  const serviceFreq: Record<string, Record<string, number>> = {};

  for (const row of thisWeekRows ?? []) {
    const pid = row.profesionist_id as string;
    thisWeekCount[pid] = (thisWeekCount[pid] ?? 0) + 1;
    // Booked minutes for utilization
    if (row.data_final && row.data_start) {
      const diffMs = new Date(row.data_final as string).getTime() - new Date(row.data_start as string).getTime();
      bookedMinutesMap[pid] = (bookedMinutesMap[pid] ?? 0) + Math.max(0, Math.round(diffMs / 60000));
    }
    const svc = row.servicii as { nume?: string } | { nume?: string }[] | null;
    const name = (Array.isArray(svc) ? svc[0]?.nume : svc?.nume) ?? null;
    if (name) {
      if (!serviceFreq[pid]) serviceFreq[pid] = {};
      serviceFreq[pid][name] = (serviceFreq[pid][name] ?? 0) + 1;
    }
  }

  for (const row of prevWeekRows ?? []) {
    const pid = row.profesionist_id as string;
    prevWeekCount[pid] = (prevWeekCount[pid] ?? 0) + 1;
  }

  for (const row of upcomingRows ?? []) {
    const pid = row.profesionist_id as string;
    upcomingCount[pid] = (upcomingCount[pid] ?? 0) + 1;
  }

  for (const row of noShowRows ?? []) {
    const pid = row.profesionist_id as string;
    noShowWeekCount[pid] = (noShowWeekCount[pid] ?? 0) + 1;
  }

  for (const row of cancellationRows ?? []) {
    const pid = row.profesionist_id as string;
    cancellationWeekCount[pid] = (cancellationWeekCount[pid] ?? 0) + 1;
  }

  // Last booking per prof (first occurrence per prof since sorted desc)
  for (const row of lastBookingRows ?? []) {
    const pid = row.profesionist_id as string;
    if (!lastBookingDateMap[pid]) {
      lastBookingDateMap[pid] = row.data_start as string;
    }
  }

  return profs.map((p) => {
    const pid = p.id as string;
    const freq = serviceFreq[pid] ?? {};
    const topService =
      Object.keys(freq).length > 0
        ? Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]
        : null;
    return {
      profId: pid,
      slug: p.slug as string,
      email: p.email_contact as string,
      numeBusiness: (p.nume_business as string | null) ?? "afacerea ta",
      bookingsThisWeek: thisWeekCount[pid] ?? 0,
      bookingsPrevWeek: prevWeekCount[pid] ?? 0,
      topService,
      upcomingNext7: upcomingCount[pid] ?? 0,
      noShowCount: noShowWeekCount[pid] ?? 0,
      cancellationCount: cancellationWeekCount[pid] ?? 0,
      daysSinceLastBooking: lastBookingDateMap[pid]
        ? Math.floor((now.getTime() - new Date(lastBookingDateMap[pid]).getTime()) / (24 * 60 * 60 * 1000))
        : null,
      utilizationPct: (() => {
        const rawProgram = (p as Record<string, unknown>).program as Record<string, unknown> | null;
        if (!rawProgram) return null;
        let scheduled = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
          const dayKey = ziKeyFromDate(d);
          const interval = rawProgram[dayKey];
          if (Array.isArray(interval) && interval.length === 2) {
            const [sh, sm] = (interval[0] as string).split(":").map(Number);
            const [eh, em] = (interval[1] as string).split(":").map(Number);
            const mins = (eh * 60 + em) - (sh * 60 + (sm ?? 0));
            if (mins > 0) scheduled += mins;
          }
        }
        if (scheduled === 0) return null;
        const booked = bookedMinutesMap[pid] ?? 0;
        return Math.min(100, Math.round((booked / scheduled) * 100));
      })()
    };
  });
}

function buildEmailContent(row: WeeklySummaryRow): { subject: string; text: string; html: string } {
  const dashboardUrl = `${SITE_URL}/dashboard`;
  const shareUrl = `${SITE_URL}/${row.slug}`;
  const safeBusinessName = escapeHtml(row.numeBusiness);

  const trend = row.bookingsThisWeek > row.bookingsPrevWeek
    ? `▲ ${row.bookingsThisWeek - row.bookingsPrevWeek} față de săptămâna trecută`
    : row.bookingsThisWeek < row.bookingsPrevWeek
    ? `▼ ${row.bookingsPrevWeek - row.bookingsThisWeek} față de săptămâna trecută`
    : "la același nivel cu săptămâna trecută";

  if (row.bookingsThisWeek === 0) {
    const subject = `${row.numeBusiness} — nicio programare săptămâna aceasta`;
    const inactivityNote = row.daysSinceLastBooking === null
      ? `Nu ai primit încă nicio programare online.`
      : row.daysSinceLastBooking <= 7
      ? `Nu ai primit programare online săptămâna aceasta.`
      : `Ultima programare a fost acum ${row.daysSinceLastBooking} de zile.`;
    const text = [
      `Salut,`,
      ``,
      inactivityNote,
      ``,
      `Cel mai rapid mod de a obține programări: trimite linkul tău clienților pe WhatsApp.`,
      ``,
      `Linkul tău: ${shareUrl}`,
      ``,
      `Accesează dashboard-ul: ${dashboardUrl}`,
      ``,
      `Spor la programări,`,
      `Echipa Ocupaloc`,
    ].join("\n");

    const html = `
<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:560px;margin:0 auto;">
  <h2 style="margin:0 0 8px;color:#111827">Raport săptămânal — ${safeBusinessName}</h2>
  <p style="margin:0 0 16px;color:#6b7280;font-size:14px;">Săptămâna aceasta nu ai primit nicio programare online.</p>
  ${row.daysSinceLastBooking !== null && row.daysSinceLastBooking > 7 ? `<p style="margin:0 0 12px;color:#dc2626;font-size:14px;font-weight:600">Ultima programare: acum ${row.daysSinceLastBooking} de zile</p>` : ``}
  <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:16px;margin:0 0 20px;">
    <p style="margin:0 0 8px;font-weight:700;color:#854d0e">Cum obții primele programări:</p>
    <ol style="margin:0;padding-left:20px;color:#854d0e">
      <li>Copiază linkul tău: <strong>${shareUrl}</strong></li>
      <li>Trimite-l pe WhatsApp la cel puțin 5 clienți</li>
      <li>Postează-l în statusul WhatsApp</li>
    </ol>
  </div>
  <a href="${dashboardUrl}" style="background:#1c1c2e;color:#fbbf24;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;display:inline-block;margin:0 0 20px;">Deschide dashboard-ul →</a>
  <p style="margin:0;color:#9ca3af;font-size:12px;">Ocupaloc · <a href="${SITE_URL}" style="color:#9ca3af">ocupaloc.ro</a></p>
</div>`;

    return { subject, text, html };
  }

  const subject = `${row.numeBusiness} — ${row.bookingsThisWeek} programări săptămâna aceasta`;
  const topServiceNote = row.topService ? `Cel mai popular serviciu: **${row.topService}**.` : "";
  const noShowNote = row.noShowCount > 0 ? `\u2022 Neprezentați: ${row.noShowCount}` : "";
  const cancellationNote = row.cancellationCount > 0 ? `\u2022 Anulări de către client: ${row.cancellationCount}` : "";
  const utilizationNote = row.utilizationPct !== null ? `• Utilizare capacitate săptămâna aceasta: ~${row.utilizationPct}%` : "";
  const text = [
    `Salut,`,
    ``,
    `Rezumatul săptămânii pentru ${row.numeBusiness}:`,
    ``,
    `• Programări această săptămână: ${row.bookingsThisWeek} (${trend})`,
    row.topService ? `• Serviciu top: ${row.topService}` : "",
    `• Programări confirmate în următoarele 7 zile: ${row.upcomingNext7}`,
    noShowNote,
    cancellationNote,
    utilizationNote,
    ``,
    topServiceNote,
    ``,
    `Accesează dashboard-ul pentru detalii: ${dashboardUrl}`,
    ``,
    `Spor la programări,`,
    `Echipa Ocupaloc`,
  ].filter(Boolean).join("\n");

  const trendColor = row.bookingsThisWeek >= row.bookingsPrevWeek ? "#16a34a" : "#dc2626";
  const safeTopService = row.topService ? escapeHtml(row.topService) : null;

  const html = `
<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:560px;margin:0 auto;">
  <h2 style="margin:0 0 4px;color:#111827">Raport săptămânal — ${safeBusinessName}</h2>
  <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">Iată cum a decurs săptămâna ta pe Ocupaloc.</p>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 20px;">
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;">
      <p style="margin:0 0 4px;font-size:32px;font-weight:700;color:#111827">${row.bookingsThisWeek}</p>
      <p style="margin:0;font-size:13px;color:#6b7280">programări săptămâna aceasta</p>
      <p style="margin:4px 0 0;font-size:12px;color:${trendColor};font-weight:600">${trend}</p>
    </div>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;">
      <p style="margin:0 0 4px;font-size:32px;font-weight:700;color:#111827">${row.upcomingNext7}</p>
      <p style="margin:0;font-size:13px;color:#6b7280">în următoarele 7 zile</p>
    </div>
  </div>

  ${safeTopService ? `<p style="margin:0 0 12px;"><strong>Serviciu top:</strong> ${safeTopService}</p>` : ""}
  ${row.noShowCount > 0 ? `<p style="margin:0 0 8px;color:#dc2626;font-size:14px;"><strong>Neprezentați săptămâna aceasta:</strong> ${row.noShowCount}</p>` : ""}
  ${row.cancellationCount > 0 ? `<p style="margin:0 0 8px;color:#d97706;font-size:14px;"><strong>Anulări de către client:</strong> ${row.cancellationCount}</p>` : ""}
  ${row.utilizationPct !== null ? `<p style="margin:0 0 20px;font-size:14px;"><strong>Utilizare capacitate:</strong> <span style="color:${row.utilizationPct >= 70 ? '#16a34a' : row.utilizationPct >= 40 ? '#d97706' : '#6b7280'}">${row.utilizationPct}%</span></p>` : ""}

  <a href="${dashboardUrl}" style="background:#1c1c2e;color:#fbbf24;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;display:inline-block;margin:0 0 20px;">Deschide dashboard-ul →</a>

  <p style="margin:0;color:#9ca3af;font-size:12px;">Ocupaloc · <a href="${SITE_URL}" style="color:#9ca3af">ocupaloc.ro</a></p>
</div>`;

  return { subject, text, html };
}

export type WeeklySummaryResult = {
  sent: number;
  skipped: number;
  failed: number;
};

export async function sendWeeklySummaries(): Promise<WeeklySummaryResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: 0, skipped: 1, failed: 0 };
  }

  const rows = await buildWeeklySummaries();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    if (!row.email) {
      skipped++;
      continue;
    }
    try {
      const content = buildEmailContent(row);
      await sendResendEmail({ to: row.email, ...content });
      sent++;
    } catch (err) {
      failed++;
      reportError("cron", "weekly_summary_send_failed", err instanceof Error ? err : new Error(String(err)), {
        profId: row.profId,
        slug: row.slug,
      });
    }
  }

  return { sent, skipped, failed };
}
