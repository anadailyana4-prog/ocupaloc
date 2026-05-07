import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/config/env";
import { validateCronSecret } from "@/lib/cron-auth";
import { reportError } from "@/lib/observability";
import { runSendEmailsJob } from "@/lib/jobs/send-emails";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!validateCronSecret(req.headers, env.optional("REMINDERS_CRON_SECRET"))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 20;

  try {
    const result = await runSendEmailsJob(limit);
    return NextResponse.json({ ok: true, ...result, ranAt: new Date().toISOString() });
  } catch (error) {
    reportError("cron", "send_emails_job_failed", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
