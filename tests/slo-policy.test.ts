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
    // 5 booking rows so the minimum-sample guard is satisfied, all failures
    { event_type: "booking_failed", outcome: "failure", status_code: 500, latency_ms: 4500 },
    { event_type: "booking_failed", outcome: "failure", status_code: 500, latency_ms: 4200 },
    { event_type: "booking_failed", outcome: "failure", status_code: 500, latency_ms: 4800 },
    { event_type: "booking_failed", outcome: "failure", status_code: 500, latency_ms: 4000 },
    { event_type: "booking_failed", outcome: "failure", status_code: 500, latency_ms: 5000 },
    { event_type: "login_failed", outcome: "failure", status_code: 401, latency_ms: 4200 },
    { event_type: "api_probe", outcome: "failure", status_code: 503, latency_ms: 4500 },
    { event_type: "api_probe", outcome: "failure", status_code: 502, latency_ms: 4000 }
  ];

  const snapshot = buildSloSnapshotFromRows(rows, 60);
  assert.equal(snapshot.releaseGate, "NO-GO");
  assert.equal(snapshot.status.bookingSuccessRate, "critical");
  assert.equal(snapshot.status.loginSuccessRate, "critical");
  assert.equal(snapshot.status.apiAvailabilityRate, "critical");
  assert.equal(snapshot.status.p95CriticalLatencyMs, "critical");
});

test("SLO snapshot marks GO when booking sample is below minimum threshold", () => {
  // Fewer than 5 booking events → treated as no data → booking rate defaults to 100
  // Use null status_code so these don't pollute the API availability metric
  const rows = [
    { event_type: "booking_failed", outcome: "failure", status_code: null, latency_ms: 300 },
    { event_type: "booking_failed", outcome: "failure", status_code: null, latency_ms: 280 },
    { event_type: "login_success", outcome: "success", status_code: 200, latency_ms: 90 },
    { event_type: "api_probe", outcome: "success", status_code: 200, latency_ms: 110 }
  ];

  const snapshot = buildSloSnapshotFromRows(rows, 60);
  assert.equal(snapshot.bookingSuccessRate, 100);
  assert.equal(snapshot.status.bookingSuccessRate, "good");
  assert.equal(snapshot.releaseGate, "GO");
});
