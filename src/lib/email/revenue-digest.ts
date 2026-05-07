export type RevenueDigestSalon = {
  salonId: string;
  salonName: string;
  revenueCurrentWeek: number;
  revenuePreviousWeek: number;
  growthPercent: number;
};

export type RevenueDigestInput = {
  weekLabel: string;
  totalCurrentWeek: number;
  totalPreviousWeek: number;
  growthPercent: number;
  topPerformers: RevenueDigestSalon[];
  churnRiskSalons: RevenueDigestSalon[];
};

function fmt(value: number): string {
  return new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON", maximumFractionDigits: 0 }).format(value);
}

function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderRevenueDigestEmail(input: RevenueDigestInput): { subject: string; text: string; html: string } {
  const subject = `Revenue weekly digest · ${input.weekLabel} · ${fmt(input.totalCurrentWeek)}`;

  const textLines = [
    `Revenue Weekly Digest (${input.weekLabel})`,
    `Current week: ${fmt(input.totalCurrentWeek)}`,
    `Previous week: ${fmt(input.totalPreviousWeek)}`,
    `Growth: ${input.growthPercent.toFixed(2)}%`,
    "",
    "Top performers:",
    ...input.topPerformers.map((row, idx) => `${idx + 1}. ${row.salonName} - ${fmt(row.revenueCurrentWeek)} (${row.growthPercent.toFixed(1)}%)`),
    "",
    "Churn risk:",
    ...(input.churnRiskSalons.length > 0
      ? input.churnRiskSalons.map((row) => `- ${row.salonName} (${fmt(row.revenueCurrentWeek)})`)
      : ["- none"])
  ];

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#09090b;color:#e4e4e7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:760px;margin:0 auto;padding:24px;">
      <h1 style="margin:0 0 8px;color:#f4f4f5;">Revenue Weekly Digest</h1>
      <p style="margin:0 0 18px;color:#a1a1aa;">${esc(input.weekLabel)}</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px;margin-bottom:20px;">
        <tr>
          <td style="background:#18181b;border:1px solid #27272a;border-radius:10px;padding:12px;">
            <div style="color:#71717a;font-size:12px;">Current Week</div>
            <div style="font-size:24px;color:#f4f4f5;font-weight:700;">${fmt(input.totalCurrentWeek)}</div>
          </td>
          <td style="background:#18181b;border:1px solid #27272a;border-radius:10px;padding:12px;">
            <div style="color:#71717a;font-size:12px;">Previous Week</div>
            <div style="font-size:24px;color:#f4f4f5;font-weight:700;">${fmt(input.totalPreviousWeek)}</div>
          </td>
          <td style="background:#18181b;border:1px solid #27272a;border-radius:10px;padding:12px;">
            <div style="color:#71717a;font-size:12px;">Growth</div>
            <div style="font-size:24px;color:${input.growthPercent >= 0 ? "#34d399" : "#f87171"};font-weight:700;">${input.growthPercent.toFixed(2)}%</div>
          </td>
        </tr>
      </table>

      <h2 style="margin:0 0 10px;font-size:16px;color:#f4f4f5;">Top performers</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#18181b;border:1px solid #27272a;border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:#111114;color:#a1a1aa;">
            <th align="left" style="padding:10px;">Salon</th>
            <th align="left" style="padding:10px;">Current</th>
            <th align="left" style="padding:10px;">Prev</th>
            <th align="left" style="padding:10px;">Growth</th>
          </tr>
        </thead>
        <tbody>
          ${input.topPerformers
            .map(
              (row) => `<tr style="border-top:1px solid #27272a;color:#e4e4e7;">
            <td style="padding:10px;">${esc(row.salonName)}</td>
            <td style="padding:10px;">${fmt(row.revenueCurrentWeek)}</td>
            <td style="padding:10px;">${fmt(row.revenuePreviousWeek)}</td>
            <td style="padding:10px;color:${row.growthPercent >= 0 ? "#34d399" : "#f87171"};">${row.growthPercent.toFixed(2)}%</td>
          </tr>`
            )
            .join("")}
        </tbody>
      </table>

      <h2 style="margin:20px 0 10px;font-size:16px;color:#f4f4f5;">Churn risk</h2>
      <ul style="margin:0;padding-left:18px;color:#d4d4d8;">
        ${input.churnRiskSalons.length > 0
          ? input.churnRiskSalons.map((row) => `<li>${esc(row.salonName)} (${fmt(row.revenueCurrentWeek)})</li>`).join("")
          : "<li>No high-risk salons this week.</li>"}
      </ul>
    </div>
  </body>
</html>`;

  return {
    subject,
    text: textLines.join("\n"),
    html
  };
}