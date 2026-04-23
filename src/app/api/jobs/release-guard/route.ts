import { NextRequest, NextResponse } from "next/server";

import { validateCronSecret } from "@/lib/cron-auth";
import { reportError } from "@/lib/observability";
import { computeSloSnapshot } from "@/lib/slo-policy";

function getGuardSecret(): string | undefined {
  return process.env.RELEASE_GUARD_SECRET?.trim() || process.env.REMINDERS_CRON_SECRET?.trim() || undefined;
}

export async function GET(req: NextRequest) {
  if (!validateCronSecret(req.headers, getGuardSecret())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const windowMinutes = Number(req.nextUrl.searchParams.get("windowMinutes") ?? "60");
  const safeWindow = Number.isFinite(windowMinutes) ? Math.min(Math.max(Math.round(windowMinutes), 5), 24 * 60) : 60;

  const snapshot = await computeSloSnapshot(safeWindow);

  if (snapshot.releaseGate === "NO-GO") {
    reportError("billing", "release_guard_blocked", "SLO critical state, release gate blocked", {
      windowMinutes: safeWindow,
      snapshot
    });

    return NextResponse.json(
      {
        ok: false,
        releaseGate: "NO-GO",
        reason: "SLO critical degradation detected",
        snapshot,
        rollbackCommandSet: [
          "npx vercel ls --prod",
          "npx vercel alias set <previous-healthy-deployment-url> ocupaloc.ro",
          "curl -s https://ocupaloc.ro/api/health | python3 -m json.tool"
        ]
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, releaseGate: "GO", snapshot }, { status: 200 });
}
