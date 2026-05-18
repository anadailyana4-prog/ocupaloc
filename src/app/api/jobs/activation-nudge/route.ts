import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/config/env";
import { validateCronSecret } from "@/lib/cron-auth";
import { runActivationNudgeJob } from "@/lib/jobs/activation-nudge";
import { reportError } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!validateCronSecret(req.headers, env.optional("REMINDERS_CRON_SECRET"))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runActivationNudgeJob();
    return NextResponse.json({ ok: true, ...result, ranAt: new Date().toISOString() });
  } catch (error) {
    reportError("cron", "activation_nudge_job_failed", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
