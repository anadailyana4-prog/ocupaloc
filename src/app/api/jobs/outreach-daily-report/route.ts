import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/config/env";
import { validateCronSecret } from "@/lib/cron-auth";
import { reportError } from "@/lib/observability";
import { buildDailyReports } from "@/lib/outreach/reporting-service";
import { notifyAdmins } from "@/lib/outreach/telegram-bot";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPORT_TIMEZONE = "Europe/Bucharest";
const REPORT_HOUR_LOCAL = Number(process.env.OUTREACH_DAILY_REPORT_HOUR ?? 21);

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
  const reportDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);

  if (!force && localHour !== REPORT_HOUR_LOCAL) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: `Outside report window (${REPORT_HOUR_LOCAL}:00 ${REPORT_TIMEZONE})`,
      localHour
    });
  }

  try {
    if (!force) {
      const admin = createSupabaseServiceClient();
      const existing = await admin
        .from("daily_reports")
        .select("id")
        .eq("report_date", reportDate)
        .eq("report_type", "operational")
        .limit(1)
        .maybeSingle();

      if (existing.error) {
        throw existing.error;
      }

      if (existing.data) {
        return NextResponse.json({
          ok: true,
          skipped: true,
          reason: "Report already sent for today",
          reportDate,
          localHour,
          timezone: REPORT_TIMEZONE
        });
      }
    }

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
