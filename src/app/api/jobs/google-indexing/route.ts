import { NextRequest, NextResponse } from "next/server";

import { validateCronSecret } from "@/lib/cron-auth";
import { runGoogleIndexingDailyJob } from "@/lib/jobs/google-indexing";
import { reportError } from "@/lib/observability";

export const dynamic = "force-dynamic";

function getJobSecret(): string | undefined {
  return process.env.SEO_CRON_SECRET?.trim() || process.env.OWNER_OPS_CRON_SECRET?.trim() || undefined;
}

export async function GET(req: NextRequest) {
  if (!validateCronSecret(req.headers, getJobSecret())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runGoogleIndexingDailyJob();
    if ("skipped" in result && result.skipped) {
      return NextResponse.json({ ok: true, ...result, ranAt: new Date().toISOString() });
    }
    return NextResponse.json({ ok: true, ...result, ranAt: new Date().toISOString() });
  } catch (error) {
    reportError("cron", "google_indexing_job_failed", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}