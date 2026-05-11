import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/config/env";
import { validateCronSecret } from "@/lib/cron-auth";
import { reportError } from "@/lib/observability";
import { runSendReviewFollowupsJob } from "@/lib/jobs/send-review-followups";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!validateCronSecret(req.headers, env.optional("REMINDERS_CRON_SECRET"))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? "300");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 1000) : 300;

  try {
    const result = await runSendReviewFollowupsJob(limit);
    return NextResponse.json({ ok: true, ...result, ranAt: new Date().toISOString() });
  } catch (error) {
    reportError("cron", "send_review_followups_job_failed", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
