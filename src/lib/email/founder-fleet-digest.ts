/**
 * Weekly founder fleet digest.
 * Sends a compact health snapshot to ADMIN_EMAIL every Monday at 08:00.
 * Covers: total accounts, band distribution, top-3 critical slugs with reason,
 * fleet bookings 7d, and counts of at-risk businesses needing attention.
 *
 * Cron: Mon 08:00 via /api/jobs/founder-fleet-digest
 */

import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { reportError } from "@/lib/observability";

const BILLING_TRIAL_DAYS = 30;

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
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

type HealthBand = "critical" | "at_risk" | "watch" | "healthy";

interface DigestRow {
  slug: string;
  business: string;
  healthBand: HealthBand;
  reason: string;
  bookings7d: number;
  upcomingConfirmed7d: number;
  pendingNext7d: number;
}

export async function sendFounderFleetDigest(): Promise<{ sent: boolean; totalAccounts: number; criticalCount: number; atRiskCount: number }> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) {
    return { sent: false, totalAccounts: 0, criticalCount: 0, atRiskCount: 0 };
  }

  const admin = createSupabaseServiceClient();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: businesses } = await admin
    .from("profesionisti")
    .select("id, slug, email_contact, nume_business, created_at, onboarding_pas")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (!businesses?.length) {
    return { sent: false, totalAccounts: 0, criticalCount: 0, atRiskCount: 0 };
  }

  const profIds = businesses.map((b) => b.id);

  const [
    { data: subs },
    { data: bookingStats },
    { data: clientCancelStats },
    { data: upcomingStats },
  ] = await Promise.all([
    admin
      .from("subscriptions")
      .select("profesionist_id, status, current_period_end")
      .in("profesionist_id", profIds)
      .order("created_at", { ascending: false }),
    admin
      .from("programari")
      .select("profesionist_id, data_start, status")
      .in("profesionist_id", profIds)
      .gte("data_start", sevenDaysAgo.toISOString())
      .limit(5000),
    admin
      .from("programari_status_events")
      .select("profesionist_id")
      .in("profesionist_id", profIds)
      .eq("status", "anulat")
      .eq("source", "client_link")
      .gte("created_at", fourteenDaysAgo.toISOString()),
    admin
      .from("programari")
      .select("profesionist_id, status")
      .in("profesionist_id", profIds)
      .in("status", ["confirmat", "in_asteptare"])
      .gte("data_start", now.toISOString())
      .lte("data_start", sevenDaysAhead.toISOString()),
  ]);

  // Build maps
  const subMap = new Map<string, { status: string }>();
  for (const s of subs ?? []) {
    if (!subMap.has(s.profesionist_id)) subMap.set(s.profesionist_id, s);
  }

  const lastBookingMap = new Map<string, string>();
  const week7dMap = new Map<string, number>();
  const noShowMap = new Map<string, number>();
  const confirmedMap = new Map<string, number>();
  for (const b of bookingStats ?? []) {
    if (!lastBookingMap.has(b.profesionist_id)) lastBookingMap.set(b.profesionist_id, b.data_start);
    if (b.status === "confirmat" || b.status === "finalizat") {
      week7dMap.set(b.profesionist_id, (week7dMap.get(b.profesionist_id) ?? 0) + 1);
      confirmedMap.set(b.profesionist_id, (confirmedMap.get(b.profesionist_id) ?? 0) + 1);
    }
    if (b.status === "noaparit") {
      noShowMap.set(b.profesionist_id, (noShowMap.get(b.profesionist_id) ?? 0) + 1);
    }
  }

  const clientCancelCountMap = new Map<string, number>();
  for (const e of clientCancelStats ?? []) {
    const pid = e.profesionist_id as string;
    clientCancelCountMap.set(pid, (clientCancelCountMap.get(pid) ?? 0) + 1);
  }

  const upcomingConfirmedMap = new Map<string, number>();
  const pendingNextMap = new Map<string, number>();
  for (const b of upcomingStats ?? []) {
    const pid = b.profesionist_id as string;
    if (b.status === "confirmat") upcomingConfirmedMap.set(pid, (upcomingConfirmedMap.get(pid) ?? 0) + 1);
    else if (b.status === "in_asteptare") pendingNextMap.set(pid, (pendingNextMap.get(pid) ?? 0) + 1);
  }

  const rows: DigestRow[] = businesses.map((b) => {
    const createdAt = b.created_at ? new Date(b.created_at) : null;
    const trialEnd = createdAt ? new Date(createdAt.getTime() + BILLING_TRIAL_DAYS * 24 * 60 * 60 * 1000) : null;
    const trialDaysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : null;
    const accountAgeDays = createdAt ? Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000)) : 0;
    const subStatus = subMap.get(b.id)?.status ?? "trial";
    const onboardingDone = (b.onboarding_pas ?? 0) >= 4;
    const lastBookingIso = lastBookingMap.get(b.id) ?? null;
    const isQuiet14d = !lastBookingIso || new Date(lastBookingIso) < fourteenDaysAgo;
    const isTrialExpired = subStatus === "trial" && trialDaysLeft !== null && trialDaysLeft < 0;
    const isTrialExpiringSoon = subStatus === "trial" && trialDaysLeft !== null && trialDaysLeft <= 5 && trialDaysLeft >= 0;
    const confirmed7d = confirmedMap.get(b.id) ?? 0;
    const noShows7d = noShowMap.get(b.id) ?? 0;
    const cc7d = clientCancelCountMap.get(b.id) ?? 0;
    const qualityTotal = confirmed7d + noShows7d + cc7d;
    const confirmationRate = qualityTotal >= 5 ? Math.round((confirmed7d / qualityTotal) * 100) : null;
    const upcomingConfirmed7d = upcomingConfirmedMap.get(b.id) ?? 0;
    const pendingNext7d = pendingNextMap.get(b.id) ?? 0;

    const healthBand: HealthBand = (() => {
      if (!onboardingDone) return "critical";
      if (subStatus === "past_due" || subStatus === "canceled") return "critical";
      if (isTrialExpired) return "critical";
      if (isQuiet14d && accountAgeDays > 14) return upcomingConfirmed7d > 0 ? "watch" : "at_risk";
      if (confirmationRate !== null && confirmationRate < 60) return "at_risk";
      if (isTrialExpiringSoon) return "watch";
      if (confirmationRate !== null && confirmationRate < 80) return "watch";
      if (isQuiet14d) return "watch";
      return "healthy";
    })();

    let reason = "";
    if (!onboardingDone) reason = "setup incomplet";
    else if (subStatus === "past_due") reason = "plată restantă";
    else if (isTrialExpired) reason = "trial expirat";
    else if (isQuiet14d && accountAgeDays > 14) reason = upcomingConfirmed7d > 0 ? `inactiv 14z (↑${upcomingConfirmed7d} viitoare)` : "inactiv 14z";
    else if (confirmationRate !== null && confirmationRate < 60) reason = `conf. ${confirmationRate}%`;
    else if (isTrialExpiringSoon) reason = `trial ${trialDaysLeft}z`;
    else if (confirmationRate !== null && confirmationRate < 80) reason = `conf. ${confirmationRate}%`;

    return {
      slug: b.slug ?? "—",
      business: b.nume_business?.trim() || b.slug || "—",
      healthBand,
      reason,
      bookings7d: week7dMap.get(b.id) ?? 0,
      upcomingConfirmed7d,
      pendingNext7d,
    };
  });

  const criticalRows = rows.filter((r) => r.healthBand === "critical");
  const atRiskRows = rows.filter((r) => r.healthBand === "at_risk");
  const watchRows = rows.filter((r) => r.healthBand === "watch");
  const healthyRows = rows.filter((r) => r.healthBand === "healthy");

  const totalBookings7d = rows.reduce((s, r) => s + r.bookings7d, 0);
  const totalUpcoming = rows.reduce((s, r) => s + r.upcomingConfirmed7d, 0);
  const totalPending = rows.reduce((s, r) => s + r.pendingNext7d, 0);

  // Week label: Mon–Sun of the current week
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  const weekLabel = `${weekStart.getDate().toString().padStart(2, "0")}.${(weekStart.getMonth() + 1).toString().padStart(2, "0")} – ${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getFullYear()}`;

  // Top 5 critical + at_risk slugs for text output
  const priorityRows = [...criticalRows, ...atRiskRows].slice(0, 5);

  const textLines: string[] = [
    `Digest flotă ocupaloc — ${weekLabel}`,
    `=======================================`,
    ``,
    `DISTRIBUȚIE SĂNĂTATE`,
    `  CRITIC:   ${criticalRows.length}`,
    `  LA RISC:  ${atRiskRows.length}`,
    `  ATENȚIE:  ${watchRows.length}`,
    `  SĂNĂTOS:  ${healthyRows.length}`,
    `  TOTAL:    ${rows.length}`,
    ``,
    `ACTIVITATE 7 ZILE`,
    `  Programări (7z):          ${totalBookings7d}`,
    `  Viitoare confirmate (7z): ${totalUpcoming}`,
    `  În așteptare:             ${totalPending}`,
    ``,
  ];

  if (priorityRows.length > 0) {
    textLines.push(`CONTURI PRIORITARE (CRITIC / LA RISC)`);
    for (const r of priorityRows) {
      textLines.push(`  [${r.healthBand.toUpperCase()}] ${r.business} (${r.slug})${r.reason ? ` — ${r.reason}` : ""}`);
    }
    textLines.push(``);
    textLines.push(`Diagnose rapid:`);
    for (const r of priorityRows) {
      if (r.slug !== "—") textLines.push(`  pnpm run diagnose:business -- --slug=${r.slug}`);
    }
    textLines.push(``);
  }

  textLines.push(`Admin panel: https://ocupaloc.ro/admin/businesses`);

  const text = textLines.join("\n");

  // HTML version
  const bandLabel: Record<HealthBand, string> = { critical: "CRITIC", at_risk: "LA RISC", watch: "ATENȚIE", healthy: "OK" };
  const bandColor: Record<HealthBand, string> = { critical: "#ef4444", at_risk: "#f97316", watch: "#f59e0b", healthy: "#10b981" };

  const priorityRowsHtml = priorityRows.length > 0
    ? `
<h3 style="color:#f1f5f9;margin:24px 0 8px">Conturi prioritare — Critic / La Risc</h3>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px">
  <thead>
    <tr style="background:#1e293b;color:#94a3b8;text-align:left">
      <th style="padding:6px 10px">Business</th>
      <th style="padding:6px 10px">Slug</th>
      <th style="padding:6px 10px">Band</th>
      <th style="padding:6px 10px">Motiv</th>
      <th style="padding:6px 10px">7z</th>
      <th style="padding:6px 10px">Diagnose</th>
    </tr>
  </thead>
  <tbody>
    ${priorityRows.map((r) => `
    <tr style="border-bottom:1px solid #334155;color:#e2e8f0">
      <td style="padding:7px 10px;font-weight:600">${escapeHtml(r.business)}</td>
      <td style="padding:7px 10px;font-family:monospace;color:#94a3b8">${escapeHtml(r.slug)}</td>
      <td style="padding:7px 10px"><span style="color:${bandColor[r.healthBand]};font-weight:700">${bandLabel[r.healthBand]}</span></td>
      <td style="padding:7px 10px;color:#94a3b8">${escapeHtml(r.reason)}</td>
      <td style="padding:7px 10px;text-align:center">${r.bookings7d}</td>
      <td style="padding:7px 10px;font-family:monospace;font-size:11px;color:#64748b">--slug=${escapeHtml(r.slug)}</td>
    </tr>`).join("")}
  </tbody>
</table>`
    : `<p style="color:#64748b">Niciun cont critic sau la risc în această săptămână. ✓</p>`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0f172a;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:680px;margin:0 auto;padding:32px 16px">
  <div style="background:#1e293b;border-radius:12px;padding:24px 28px;border:1px solid #334155">
    <h1 style="color:#f8fafc;font-size:20px;margin:0 0 4px">Digest flotă ocupaloc</h1>
    <p style="color:#64748b;margin:0 0 24px;font-size:13px">${escapeHtml(weekLabel)}</p>

    <h3 style="color:#f1f5f9;margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:.05em">Distribuție sănătate</h3>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px">
      ${[
        { label: "CRITIC", count: criticalRows.length, color: "#ef4444" },
        { label: "LA RISC", count: atRiskRows.length, color: "#f97316" },
        { label: "ATENȚIE", count: watchRows.length, color: "#f59e0b" },
        { label: "SĂNĂTOS", count: healthyRows.length, color: "#10b981" },
      ].map((s) => `
      <div style="background:#0f172a;border-radius:8px;padding:12px 16px;min-width:80px;border:1px solid #1e293b">
        <div style="font-size:26px;font-weight:700;color:${s.color}">${s.count}</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px">${s.label}</div>
      </div>`).join("")}
    </div>

    <h3 style="color:#f1f5f9;margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:.05em">Activitate 7 zile</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-bottom:24px">
      <tr><td style="color:#94a3b8;padding:3px 0">Programări (7z)</td><td style="color:#f1f5f9;text-align:right;font-weight:600">${totalBookings7d}</td></tr>
      <tr><td style="color:#94a3b8;padding:3px 0">Viitoare confirmate (7z)</td><td style="color:${totalUpcoming > 0 ? "#10b981" : "#64748b"};text-align:right;font-weight:600">${totalUpcoming}</td></tr>
      <tr><td style="color:#94a3b8;padding:3px 0">În așteptare neconfirmate</td><td style="color:${totalPending > 0 ? "#f97316" : "#64748b"};text-align:right;font-weight:600">${totalPending}</td></tr>
      <tr><td style="color:#94a3b8;padding:3px 0">Total conturi</td><td style="color:#f1f5f9;text-align:right;font-weight:600">${rows.length}</td></tr>
    </table>

    ${priorityRowsHtml}

    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #334155">
      <a href="https://ocupaloc.ro/admin/businesses" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600">Deschide Admin Panel →</a>
    </div>
  </div>
  <p style="color:#334155;font-size:11px;text-align:center;margin-top:16px">Digest automat ocupaloc — ${now.toISOString().slice(0, 10)}</p>
</div>
</body>
</html>`;

  try {
    await sendResendEmail({
      to: adminEmail,
      subject: `Digest flotă ocupaloc — ${weekLabel} (${criticalRows.length} critic, ${atRiskRows.length} la risc)`,
      text,
      html,
    });
    return {
      sent: true,
      totalAccounts: rows.length,
      criticalCount: criticalRows.length,
      atRiskCount: atRiskRows.length,
    };
  } catch (err) {
    reportError("email", "founder_fleet_digest_failed", err instanceof Error ? err : new Error(String(err)));
    return { sent: false, totalAccounts: rows.length, criticalCount: criticalRows.length, atRiskCount: atRiskRows.length };
  }
}
