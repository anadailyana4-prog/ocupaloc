import { NextRequest, NextResponse } from "next/server";

import { validateCronSecret } from "@/lib/cron-auth";
import { env } from "@/lib/config/env";
import { reportError } from "@/lib/observability";
import { syncOutreachReplies } from "@/lib/outreach/reply-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = env.optional("OUTREACH_CRON_SECRET") ?? env.optional("CRON_SECRET");
  if (!validateCronSecret(request.headers, secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncOutreachReplies();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    reportError("cron", "sync_outreach_replies_failed", error);
    return NextResponse.json({ ok: false, error: "Reply sync failed" }, { status: 500 });
  }
}