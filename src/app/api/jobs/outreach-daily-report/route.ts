import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/config/env";
import { validateCronSecret } from "@/lib/cron-auth";
import { reportError } from "@/lib/observability";
import { buildDailyReports } from "@/lib/outreach/reporting-service";
import { notifyAdmins } from "@/lib/outreach/telegram-bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPORT_TIMEZONE = "Europe/Bucharest";
const REPORT_HOUR_LOCAL = 9;

function getBucharestHour(now: Date) {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: REPORT_TIMEZONE,
    hour: "2-digit",
    hour12: false
  }).format(now);
  return Number(hour);
}

export async function GET(request: NextRequest) {
  const secret = env.optional("OUTREACH_CRON_SECRET") ?? env.optional("CRON_SECRET");
  if (!validateCronSecret(request.headers, secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get("force") === "true";
  const now = new Date();
  const localHour = getBucharestHour(now);

  if (!force && localHour !== REPORT_HOUR_LOCAL) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: `Outside report window (${REPORT_HOUR_LOCAL}:00 ${REPORT_TIMEZONE})`,
      localHour
    });
  }

  try {
    const report = await buildDailyReports();
    const message = [
      "📊 RAPORT ZILNIC OUTREACH",
      "",
      report.operational,
      "",
      report.coverage,
      "",
      report.efficiency,
      "",
      report.handoff
    ].join("\n");

    await notifyAdmins(message);

    return NextResponse.json({
      ok: true,
      sent: true,
      localHour,
      timezone: REPORT_TIMEZONE
    });
  } catch (error) {
    reportError("cron", "outreach_daily_report_failed", error, { localHour, force });
    return NextResponse.json({ ok: false, error: "Outreach daily report failed" }, { status: 500 });
  }
}
