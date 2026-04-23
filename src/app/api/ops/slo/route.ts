import { NextRequest, NextResponse } from "next/server";

import { validateCronSecret } from "@/lib/cron-auth";
import { computeSloSnapshot, SLO_POLICY } from "@/lib/slo-policy";

function getSloSecret(): string | undefined {
  return process.env.SLO_READ_SECRET?.trim() || process.env.REMINDERS_CRON_SECRET?.trim() || undefined;
}

function pct(n: number): number {
  return Number(n.toFixed(2));
}

function budgetUsed(actual: number, target: number): number {
  const budget = 100 - target;
  if (budget <= 0) return 0;
  const consumed = Math.max(0, target - actual) / budget;
  return pct(consumed * 100);
}

function latencyBudgetUsed(actualMs: number, targetMs: number): number {
  if (targetMs <= 0) return 0;
  if (actualMs <= targetMs) return 0;
  return pct(((actualMs - targetMs) / targetMs) * 100);
}

export async function GET(req: NextRequest) {
  if (!validateCronSecret(req.headers, getSloSecret())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const windowMinutes = Number(req.nextUrl.searchParams.get("windowMinutes") ?? "60");
  const safeWindow = Number.isFinite(windowMinutes) ? Math.min(Math.max(Math.round(windowMinutes), 5), 24 * 60) : 60;

  try {
    const snapshot = await computeSloSnapshot(safeWindow);

    const errorBudget = {
      bookingSuccessRatePctUsed: budgetUsed(snapshot.bookingSuccessRate, SLO_POLICY.bookingSuccessRate.good),
      loginSuccessRatePctUsed: budgetUsed(snapshot.loginSuccessRate, SLO_POLICY.loginSuccessRate.good),
      apiAvailabilityPctUsed: budgetUsed(snapshot.apiAvailabilityRate, SLO_POLICY.apiAvailabilityRate.good),
      latencyP95PctOverTarget: latencyBudgetUsed(snapshot.p95CriticalLatencyMs, SLO_POLICY.p95CriticalLatency.goodMs)
    };

    return NextResponse.json({
      ok: true,
      snapshot,
      sloTargets: SLO_POLICY,
      errorBudget,
      releaseGate: snapshot.releaseGate
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "SLO computation failed"
      },
      { status: 500 }
    );
  }
}
