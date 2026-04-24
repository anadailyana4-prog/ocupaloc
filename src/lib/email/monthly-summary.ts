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

type MonthlyRow = {
  profId: string;
  email: string;
  numeBusiness: string;
  slug: string;
  thisMonthCount: number;
  prevMonthCount: number;
  topService: string | null;
  noShowCount: number;
  cancellationCount: number;
  confirmationRate: number | null; // % = confirmed / (confirmed + noShow + clientCancellations)
  isFirstMonth: boolean; // account was created during the reporting month
};

/** Returns [start, end) ISO strings for a calendar month offset. 0 = current month, -1 = previous. */
function monthBounds(offsetMonths: number): { start: string; end: string } {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + offsetMonths; // can be negative, Date handles it
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

const ROMANIAN_MONTHS = [
  "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
  "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"
];

async function buildMonthlySummaries(): Promise<MonthlyRow[]> {
  const admin = createSupabaseServiceClient();

  // reportingMonth = the calendar month just completed (e.g. April when cron runs May 1st)
  // comparisonMonth = the month before that (e.g. March) — used as the trend baseline
  const reportingMonth = monthBounds(-1);
  const comparisonMonth = monthBounds(-2);

  const { data: profs, error: profErr } = await admin
    .from("profesionisti")
    .select("id, slug, email_contact, nume_business, created_at")
    .not("email_contact", "is", null)
    .neq("email_contact", "")
    .order("id");

  if (profErr || !profs?.length) {
    if (profErr) reportError("cron", "monthly_summary_profs_failed", profErr);
    return [];
  }

  const profIds = profs.map((p) => p.id as string);

  const [{ data: thisRows }, { data: prevRows }, { data: noShowRows }, { data: cancellationRows }] = await Promise.all([
    admin
      .from("programari")
      .select("profesionist_id, servicii(nume)")
      .in("profesionist_id", profIds)
      .in("status", ["confirmat", "finalizat"])
      .gte("data_start", reportingMonth.start)
      .lt("data_start", reportingMonth.end),
    admin
      .from("programari")
      .select("profesionist_id")
      .in("profesionist_id", profIds)
      .in("status", ["confirmat", "finalizat"])
      .gte("data_start", comparisonMonth.start)
      .lt("data_start", comparisonMonth.end),
    admin
      .from("programari")
      .select("profesionist_id")
      .in("profesionist_id", profIds)
      .eq("status", "noaparit")
      .gte("data_start", reportingMonth.start)
      .lt("data_start", reportingMonth.end),
    admin
      .from("programari_status_events")
      .select("profesionist_id")
      .in("profesionist_id", profIds)
      .eq("status", "anulat")
      .eq("source", "client_link")
      .gte("created_at", reportingMonth.start)
      .lt("created_at", reportingMonth.end)
  ]);

  // Build counts per prof
  const thisCount = new Map<string, number>();
  const serviceFreq = new Map<string, Map<string, number>>();

  for (const r of thisRows ?? []) {
    const pid = r.profesionist_id as string;
    thisCount.set(pid, (thisCount.get(pid) ?? 0) + 1);
    const relServ = r.servicii as { nume?: string } | { nume?: string }[] | null;
    const svcName = Array.isArray(relServ) ? (relServ[0]?.nume ?? null) : (relServ?.nume ?? null);
    if (svcName) {
      if (!serviceFreq.has(pid)) serviceFreq.set(pid, new Map());
      const map = serviceFreq.get(pid)!;
      map.set(svcName, (map.get(svcName) ?? 0) + 1);
    }
  }

  const prevCount = new Map<string, number>();
  for (const r of prevRows ?? []) {
    const pid = r.profesionist_id as string;
    prevCount.set(pid, (prevCount.get(pid) ?? 0) + 1);
  }

  const noShowCount = new Map<string, number>();
  for (const r of noShowRows ?? []) {
    const pid = r.profesionist_id as string;
    noShowCount.set(pid, (noShowCount.get(pid) ?? 0) + 1);
  }

  const cancellationCount = new Map<string, number>();
  for (const r of cancellationRows ?? []) {
    const pid = r.profesionist_id as string;
    cancellationCount.set(pid, (cancellationCount.get(pid) ?? 0) + 1);
  }

  return profs
    .filter((p) => p.email_contact)
    .map((p) => {
      const pid = p.id as string;
      const freq = serviceFreq.get(pid);
      let topService: string | null = null;
      if (freq) {
        let best = 0;
        for (const [name, count] of freq) {
          if (count > best) { best = count; topService = name; }
        }
      }
      return {
        profId: pid,
        email: p.email_contact as string,
        numeBusiness: (p.nume_business as string | null)?.trim() || "Afacerea ta",
        slug: (p.slug as string | null) ?? "",
        thisMonthCount: thisCount.get(pid) ?? 0,
        prevMonthCount: prevCount.get(pid) ?? 0,
        topService,
        noShowCount: noShowCount.get(pid) ?? 0,
        cancellationCount: cancellationCount.get(pid) ?? 0,
        confirmationRate: (() => {
          const confirmed = thisCount.get(pid) ?? 0;
          const ns = noShowCount.get(pid) ?? 0;
          const ca = cancellationCount.get(pid) ?? 0;
          const total = confirmed + ns + ca;
          return total >= 5 ? Math.round((confirmed / total) * 100) : null;
        })(),
        isFirstMonth: (() => {
          const createdAt = (p.created_at as string | null) ?? null;
          return !!createdAt && createdAt >= reportingMonth.start && createdAt < reportingMonth.end;
        })()
      };
    })
    .filter((r) => r.thisMonthCount > 0 || r.prevMonthCount > 0); // skip accounts with no activity
}

function buildMonthlyEmailContent(row: MonthlyRow, monthName: string): { subject: string; text: string; html: string } {
  const delta = row.thisMonthCount - row.prevMonthCount;
  const trend = delta > 0 ? `▲ +${delta} față de luna trecută` : delta < 0 ? `▼ ${delta} față de luna trecută` : "= Același număr ca luna trecută";
  const dashboardUrl = `${SITE_URL}/dashboard`;
  const business = escapeHtml(row.numeBusiness);

  // First-month welcome: no trend comparison, celebrate the start
  if (row.isFirstMonth) {
    const subject = `Prima ta lună pe Ocupaloc — ${row.thisMonthCount} programări`;
    const text = [
      `Salut ${row.numeBusiness},`,
      "",
      `Felicitări pentru prima lună pe Ocupaloc!`,
      "",
      `  • Programări confirmate în ${monthName}: ${row.thisMonthCount}`,
      row.topService ? `  • Serviciu top: ${row.topService}` : null,
      row.noShowCount > 0 ? `  • Clienți neprezentați: ${row.noShowCount}` : null,
      row.cancellationCount > 0 ? `  • Anulări client: ${row.cancellationCount}` : null,
      "",
      row.thisMonthCount > 0
        ? `Un start solid. Continuă să trimiți linkul clienților pe WhatsApp și Instagram.`
        : `Dacă nu ai primit programări online încă, trimite linkul tău la cel puțin 10 clienți actuali pe WhatsApp.`,
      "",
      `Dashboard: ${dashboardUrl}`,
      "",
      "Ocupaloc"
    ].filter((l) => l !== null).join("\n");

    const html = `
<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:560px;margin:0 auto;">
  <h2 style="margin:0 0 4px;">🎉 Prima lună pe Ocupaloc</h2>
  <p style="margin:0 0 16px;color:#6b7280;">${business}</p>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:0 0 20px;">
    <p style="margin:0 0 4px;font-size:36px;font-weight:700;">${row.thisMonthCount}</p>
    <p style="margin:0 0 12px;color:#6b7280;">programări confirmate în ${escapeHtml(monthName)}</p>
    ${row.topService ? `<p style="margin:0 0 4px;"><strong>Serviciu top:</strong> ${escapeHtml(row.topService)}</p>` : ""}
    ${row.noShowCount > 0 ? `<p style="margin:0 0 4px;"><strong>Neprezentați:</strong> ${row.noShowCount}</p>` : ""}
    ${row.cancellationCount > 0 ? `<p style="margin:0 0 4px;"><strong>Anulări client:</strong> ${row.cancellationCount}</p>` : ""}
  </div>
  <p style="margin:0 0 16px;">${row.thisMonthCount > 0 ? "Un start solid. Continuă să trimiți linkul clienților!" : "Dacă nu ai primit programări online încă, trimite linkul la cel puțin 10 clienți actuali pe WhatsApp."}</p>
  <a href="${dashboardUrl}" style="background:#1c1c2e;color:#fbbf24;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;display:inline-block;margin:0 0 20px;">Deschide dashboard-ul →</a>
  <p style="margin:0;color:#9ca3af;font-size:12px;">Ocupaloc · <a href="${SITE_URL}" style="color:#9ca3af;">ocupaloc.ro</a></p>
</div>`;
    return { subject, text, html };
  }

  const subject = `Rezumat ${monthName}: ${row.thisMonthCount} programări la ${row.numeBusiness}`;

  const text = [
    `Salut ${row.numeBusiness},`,
    "",
    `Rezumatul lunii ${monthName}:`,
    `  • Programări confirmate: ${row.thisMonthCount}`,
    `  • Luna trecută: ${row.prevMonthCount}  (${trend})`,
    row.topService ? `  • Serviciu top: ${row.topService}` : null,
    row.noShowCount > 0 ? `  • Clienți neprezentați: ${row.noShowCount}` : null,
    row.cancellationCount > 0 ? `  • Anulări client: ${row.cancellationCount}` : null,
    row.confirmationRate !== null ? `  • Rată de confirmare: ${row.confirmationRate}%` : null,
    "",
    delta > 0
      ? `Progres real — luna aceasta ai avut mai mulți clienți. Continuă să trimiți linkul!`
      : row.thisMonthCount === 0
      ? `Nicio programare luna aceasta. Trimite linkul clienților pe WhatsApp sau Instagram.`
      : `Stabil. Gândește-te cum poți aduce clienți noi luna viitoare.`,
    "",
    `Dashboard: ${dashboardUrl}`,
    "",
    "Ocupaloc"
  ].filter((l) => l !== null).join("\n");

  const noShowLine = row.noShowCount > 0
    ? `<p style="margin:0 0 4px;"><strong>Neprezentați:</strong> ${row.noShowCount}</p>`
    : "";
  const cancellationLine = row.cancellationCount > 0
    ? `<p style="margin:0 0 4px;"><strong>Anulări client:</strong> ${row.cancellationCount}</p>`
    : "";
  const confirmationRateLine = row.confirmationRate !== null
    ? `<p style="margin:0 0 4px;"><strong>Rată de confirmare:</strong> <span style="color:${row.confirmationRate >= 80 ? "#16a34a" : row.confirmationRate >= 60 ? "#d97706" : "#dc2626"}">${row.confirmationRate}%</span></p>`
    : "";

  const html = `
<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:560px;margin:0 auto;">
  <h2 style="margin:0 0 4px;">📅 Rezumat ${escapeHtml(monthName)}</h2>
  <p style="margin:0 0 16px;color:#6b7280;">${business}</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:0 0 20px;">
    <p style="margin:0 0 4px;font-size:36px;font-weight:700;">${row.thisMonthCount}</p>
    <p style="margin:0 0 12px;color:#6b7280;">programări confirmate</p>
    <p style="margin:0 0 4px;"><strong>Luna trecută:</strong> ${row.prevMonthCount} &nbsp;
      <span style="color:${delta > 0 ? "#16a34a" : delta < 0 ? "#dc2626" : "#6b7280"}">${trend}</span>
    </p>
    ${row.topService ? `<p style="margin:0 0 4px;"><strong>Serviciu top:</strong> ${escapeHtml(row.topService)}</p>` : ""}
    ${noShowLine}
    ${cancellationLine}
    ${confirmationRateLine}
  </div>

  <p style="margin:0 0 16px;">${
    delta > 0
      ? "Progres real — luna aceasta ai avut mai mulți clienți. Continuă!"
      : row.thisMonthCount === 0
      ? "Nicio programare luna aceasta. Trimite linkul clienților pe WhatsApp sau Instagram."
      : "Stabil. Gândește-te cum poți aduce clienți noi luna viitoare."
  }</p>

  <a href="${dashboardUrl}" style="background:#1c1c2e;color:#fbbf24;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;display:inline-block;margin:0 0 20px;">
    Deschide dashboard-ul →
  </a>

  <p style="margin:0;color:#9ca3af;font-size:12px;">Ocupaloc · <a href="${SITE_URL}" style="color:#9ca3af;">ocupaloc.ro</a></p>
</div>`;

  return { subject, text, html };
}

export async function sendMonthlySummaries(): Promise<{ sent: number; skipped: number; failed: number }> {
  const now = new Date();
  // Month name for the month just completed (previous month)
  const prevMonthIndex = now.getUTCMonth() === 0 ? 11 : now.getUTCMonth() - 1;
  const monthName = ROMANIAN_MONTHS[prevMonthIndex] ?? "luna trecută";

  const rows = await buildMonthlySummaries();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    if (!row.email) { skipped++; continue; }
    try {
      const content = buildMonthlyEmailContent(row, monthName);
      await sendResendEmail({ to: row.email, ...content });
      sent++;
    } catch (err) {
      failed++;
      reportError("cron", "monthly_summary_send_failed", err, { profId: row.profId, email: row.email });
    }
  }

  return { sent, skipped, failed };
}
