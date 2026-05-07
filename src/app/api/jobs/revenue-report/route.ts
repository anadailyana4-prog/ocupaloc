import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/config/env";
import { validateCronSecret } from "@/lib/cron-auth";
import { runWeeklyRevenueReport } from "@/lib/jobs/revenue-report";
import { reportError } from "@/lib/observability";
import { getRequestId, recordOperationalEvent } from "@/lib/ops-events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const startedAt = Date.now();

  if (!validateCronSecret(req.headers, env.optional("REMINDERS_CRON_SECRET"))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: { "x-request-id": requestId } });
  }

  try {
    const result = await runWeeklyRevenueReport(requestId);
    await recordOperationalEvent({
      eventType: "cron_revenue_report_ok",
      flow: "cron",
      outcome: "success",
      requestId,
      latencyMs: Date.now() - startedAt,
      metadata: {
        sent: result.sent,
        recipients: result.recipients,
        growthPercent: result.growthPercent,
        totalCurrentWeek: result.totalCurrentWeek
      }
    });

    return NextResponse.json({ ok: true, ...result, ranAt: new Date().toISOString() }, { headers: { "x-request-id": requestId } });
  } catch (error) {
    reportError("cron", "weekly_revenue_report_failed", error, { requestId });
    await recordOperationalEvent({
      eventType: "cron_revenue_report_failed",
      flow: "cron",
      outcome: "failure",
      requestId,
      latencyMs: Date.now() - startedAt,
      metadata: { error: error instanceof Error ? error.message : String(error) }
    });

    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500, headers: { "x-request-id": requestId } });
  }
}