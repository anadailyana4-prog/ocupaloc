import { NextRequest, NextResponse } from "next/server";

import { validateCronSecret } from "@/lib/cron-auth";
import { reportError } from "@/lib/observability";
import { sendFounderFleetDigest } from "@/lib/email/founder-fleet-digest";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!validateCronSecret(req.headers, process.env.REMINDERS_CRON_SECRET?.trim())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendFounderFleetDigest();
    return NextResponse.json({ ok: true, ...result, ranAt: new Date().toISOString() });
  } catch (err) {
    reportError("cron", "founder_fleet_digest_cron_failed", err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
