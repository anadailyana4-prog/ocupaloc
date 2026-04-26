import { NextRequest, NextResponse } from "next/server";

import { validateCronSecret } from "@/lib/cron-auth";
import { reportError } from "@/lib/observability";
import { recordOperationalEvent } from "@/lib/ops-events";
import { sendTrialExpiryWarnings } from "@/lib/email/trial-expiry-warning";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!validateCronSecret(req.headers, process.env.REMINDERS_CRON_SECRET?.trim())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const result = await sendTrialExpiryWarnings();
    await recordOperationalEvent({
      eventType: "cron_trial_expiry_ok",
      flow: "cron",
      outcome: "success",
      latencyMs: Date.now() - startedAt,
      metadata: { sent: result.sent, skipped: result.skipped, failed: result.failed },
    });
    return NextResponse.json({ ok: true, ...result, ranAt: new Date().toISOString() });
  } catch (err) {
    reportError("cron", "trial_expiry_cron_failed", err instanceof Error ? err : new Error(String(err)));
    void recordOperationalEvent({
      eventType: "cron_trial_expiry_failed",
      flow: "cron",
      outcome: "failure",
      latencyMs: Date.now() - startedAt,
      metadata: { error: String(err) },
    }).catch(() => {});
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
