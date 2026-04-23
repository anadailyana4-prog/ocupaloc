import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type SloLevel = "good" | "warn" | "critical";

type NumericThreshold = {
  good: number;
  warn: number;
};

type LatencyThreshold = {
  goodMs: number;
  warnMs: number;
};

export const SLO_POLICY = {
  bookingSuccessRate: { good: 99, warn: 97 } satisfies NumericThreshold,
  loginSuccessRate: { good: 99, warn: 97 } satisfies NumericThreshold,
  apiAvailabilityRate: { good: 99.9, warn: 99 } satisfies NumericThreshold,
  p95CriticalLatency: { goodMs: 800, warnMs: 1500 } satisfies LatencyThreshold
};

export type SloSnapshot = {
  windowMinutes: number;
  bookingSuccessRate: number;
  loginSuccessRate: number;
  apiAvailabilityRate: number;
  p95CriticalLatencyMs: number;
  status: {
    bookingSuccessRate: SloLevel;
    loginSuccessRate: SloLevel;
    apiAvailabilityRate: SloLevel;
    p95CriticalLatencyMs: SloLevel;
  };
  releaseGate: "GO" | "NO-GO";
  generatedAt: string;
};

export type SloEventRow = {
  event_type: string;
  outcome: string;
  status_code: number | null;
  latency_ms: number | null;
};

function safeRate(success: number, total: number): number {
  if (total <= 0) return 100;
  return Number(((success / total) * 100).toFixed(3));
}

function percentile95(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[index] ?? 0;
}

function classifyRate(value: number, t: NumericThreshold): SloLevel {
  if (value >= t.good) return "good";
  if (value >= t.warn) return "warn";
  return "critical";
}

function classifyLatency(valueMs: number, t: LatencyThreshold): SloLevel {
  if (valueMs <= t.goodMs) return "good";
  if (valueMs <= t.warnMs) return "warn";
  return "critical";
}

export function buildSloSnapshotFromRows(rows: SloEventRow[], windowMinutes = 60): SloSnapshot {
  const bookingRows = rows.filter((r) => r.event_type === "booking_created" || r.event_type === "booking_failed");
  const bookingSuccess = bookingRows.filter((r) => r.outcome === "success").length;
  const bookingSuccessRate = safeRate(bookingSuccess, bookingRows.length);

  const loginRows = rows.filter((r) => r.event_type === "login_success" || r.event_type === "login_failed");
  const loginSuccess = loginRows.filter((r) => r.outcome === "success").length;
  const loginSuccessRate = safeRate(loginSuccess, loginRows.length);

  const apiRows = rows.filter((r) => typeof r.status_code === "number");
  const api5xx = apiRows.filter((r) => (r.status_code ?? 0) >= 500).length;
  const apiAvailabilityRate = safeRate(apiRows.length - api5xx, apiRows.length);

  const latencyRows = rows
    .filter((r) => typeof r.latency_ms === "number")
    .map((r) => Number(r.latency_ms))
    .filter((n) => Number.isFinite(n) && n >= 0);
  const p95CriticalLatencyMs = percentile95(latencyRows);

  const status = {
    bookingSuccessRate: classifyRate(bookingSuccessRate, SLO_POLICY.bookingSuccessRate),
    loginSuccessRate: classifyRate(loginSuccessRate, SLO_POLICY.loginSuccessRate),
    apiAvailabilityRate: classifyRate(apiAvailabilityRate, SLO_POLICY.apiAvailabilityRate),
    p95CriticalLatencyMs: classifyLatency(p95CriticalLatencyMs, SLO_POLICY.p95CriticalLatency)
  };

  const hasCritical = Object.values(status).some((v) => v === "critical");

  return {
    windowMinutes,
    bookingSuccessRate,
    loginSuccessRate,
    apiAvailabilityRate,
    p95CriticalLatencyMs,
    status,
    releaseGate: hasCritical ? "NO-GO" : "GO",
    generatedAt: new Date().toISOString()
  };
}

export async function computeSloSnapshot(windowMinutes = 60): Promise<SloSnapshot> {
  const admin = createSupabaseServiceClient();
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();

  const { data, error } = await admin
    .from("operational_events")
    .select("event_type, outcome, status_code, latency_ms")
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(10_000);

  if (error) {
    throw new Error(`SLO query failed: ${error.message}`);
  }

  return buildSloSnapshotFromRows((data ?? []) as SloEventRow[], windowMinutes);
}
