import test from "node:test";
import assert from "node:assert/strict";

import { buildSloSnapshotFromRows } from "../src/lib/slo-policy";

test("SLO snapshot marks GO when all indicators are healthy", () => {
  const rows = [
    { event_type: "booking_created", outcome: "success", status_code: 200, latency_ms: 120 },
    { event_type: "booking_created", outcome: "success", status_code: 200, latency_ms: 180 },
    { event_type: "login_success", outcome: "success", status_code: 200, latency_ms: 90 },
    { event_type: "api_probe", outcome: "success", status_code: 200, latency_ms: 140 },
    { event_type: "api_probe", outcome: "success", status_code: 204, latency_ms: 110 }
  ];

  const snapshot = buildSloSnapshotFromRows(rows, 60);
  assert.equal(snapshot.releaseGate, "GO");
  assert.equal(snapshot.status.bookingSuccessRate, "good");
  assert.equal(snapshot.status.loginSuccessRate, "good");
  assert.equal(snapshot.status.apiAvailabilityRate, "good");
  assert.equal(snapshot.status.p95CriticalLatencyMs, "good");
});

test("SLO snapshot marks NO-GO on severe booking/login/api degradation", () => {
  const rows = [
    { event_type: "booking_created", outcome: "success", status_code: 200, latency_ms: 600 },
    { event_type: "booking_failed", outcome: "failure", status_code: 500, latency_ms: 2200 },
    { event_type: "login_failed", outcome: "failure", status_code: 401, latency_ms: 1700 },
    { event_type: "api_probe", outcome: "failure", status_code: 503, latency_ms: 2000 },
    { event_type: "api_probe", outcome: "failure", status_code: 502, latency_ms: 1800 }
  ];

  const snapshot = buildSloSnapshotFromRows(rows, 60);
  assert.equal(snapshot.releaseGate, "NO-GO");
  assert.equal(snapshot.status.bookingSuccessRate, "critical");
  assert.equal(snapshot.status.loginSuccessRate, "critical");
  assert.equal(snapshot.status.apiAvailabilityRate, "critical");
  assert.equal(snapshot.status.p95CriticalLatencyMs, "critical");
});
