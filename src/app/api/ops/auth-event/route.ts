import { NextRequest, NextResponse } from "next/server";

import { getRequestId, recordOperationalEvent } from "@/lib/ops-events";

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const body = await req.json().catch(() => ({}));
  const outcome = body && body.outcome === "success" ? "success" : "failure";
  const eventType = outcome === "success" ? "login_success" : "login_failed";

  const metadata = {
    source: "login_page",
    reason: typeof body?.reason === "string" ? body.reason.slice(0, 180) : null
  };

  await recordOperationalEvent({
    eventType,
    flow: "auth",
    outcome,
    requestId,
    statusCode: outcome === "success" ? 200 : 401,
    metadata
  });

  return NextResponse.json({ ok: true, requestId });
}
