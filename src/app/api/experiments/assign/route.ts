import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { getRequestId, recordOperationalEvent } from "@/lib/ops-events";

function assignVariant(experimentId: string, anonId: string, splitA: number): "A" | "B" {
  const hash = createHash("sha256").update(`${experimentId}:${anonId}`).digest("hex");
  const bucket = parseInt(hash.slice(0, 8), 16) % 100;
  return bucket < splitA ? "A" : "B";
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const params = req.nextUrl.searchParams;
  const experimentId = params.get("experiment")?.trim() || "pricing_packaging_v1";
  const anonId = params.get("id")?.trim();
  const splitRaw = Number(params.get("split_a") || "50");
  const splitA = Number.isFinite(splitRaw) ? Math.min(95, Math.max(5, Math.floor(splitRaw))) : 50;

  if (!anonId) {
    return NextResponse.json({ ok: false, requestId, error: "Missing anonymous id." }, { status: 400 });
  }

  const variant = assignVariant(experimentId, anonId, splitA);

  await recordOperationalEvent({
    eventType: "growth_experiment_exposure",
    flow: "growth",
    outcome: "success",
    requestId,
    statusCode: 200,
    metadata: {
      experiment_id: experimentId,
      variant,
      split_a: splitA,
      anon_id: anonId,
      source: "experiment_assign"
    }
  });

  return NextResponse.json({ ok: true, requestId, experimentId, variant, splitA });
}
