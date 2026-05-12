import assert from "node:assert/strict";
import test from "node:test";

import { evaluateZoneExhaustion } from "../src/lib/outreach/exhaustion";
import {
  assertZoneTransition,
  buildCoverageZoneTransition,
  getResumeStatus
} from "../src/lib/outreach/ops-state-machine";

test("coverage zone state machine accepts allowed transitions", () => {
  assert.doesNotThrow(() => assertZoneTransition("planned", "scraping"));
  assert.doesNotThrow(() => assertZoneTransition("ready", "sending"));
  assert.doesNotThrow(() => assertZoneTransition("sending", "cooldown"));
  assert.doesNotThrow(() => assertZoneTransition("paused", "ready"));
});

test("coverage zone state machine rejects invalid transitions", () => {
  assert.throws(() => assertZoneTransition("planned", "sending"), /Invalid coverage zone transition/i);
  assert.throws(() => assertZoneTransition("cooldown", "exhausted"), /Invalid coverage zone transition/i);
});

test("coverage zone transition builder validates payload shape", () => {
  const transition = buildCoverageZoneTransition({
    zoneId: "2c44f82a-d58f-4850-b0a3-d6f2583a9c53",
    fromStatus: "ready",
    toStatus: "sending",
    reason: "Pornire batch aprobat din Telegram",
    changedByType: "telegram",
    context: { sursa: "operator" }
  });

  assert.equal(transition.toStatus, "sending");
});

test("resume status returns sending when zone was paused mid-send", () => {
  assert.equal(getResumeStatus("sending"), "sending");
  assert.equal(getResumeStatus("qualifying"), "ready");
});

test("exhaustion evaluator flags zone near exhaustion", () => {
  const result = evaluateZoneExhaustion({
    scrapingCompleted: true,
    scrapeRunsCount: 3,
    latestNewValidLeads: 3,
    previousNewValidLeads: 6,
    rerunHistory: [221, 38, 6, 3],
    remainingContactableLeads: 18,
    uncontactableLeads: 30,
    duplicateLeads: 42,
    alreadyContactedLeads: 221,
    suppressedLeads: 3,
    lowYieldRunsCount: 2,
    usefulYieldRate: 0.04,
    confirmationRunsWithoutUsefulVolume: 0
  });

  assert.equal(result.stage, "exhausted_candidate");
  assert.equal(result.probableExhaustion, "mare");
  assert.equal(result.shouldMarkExhausted, false);
});

test("exhaustion evaluator marks exhausted only after confirmation run", () => {
  const result = evaluateZoneExhaustion({
    scrapingCompleted: true,
    scrapeRunsCount: 4,
    latestNewValidLeads: 1,
    previousNewValidLeads: 6,
    rerunHistory: [430, 38, 6, 1],
    remainingContactableLeads: 7,
    uncontactableLeads: 43,
    duplicateLeads: 57,
    alreadyContactedLeads: 221,
    suppressedLeads: 5,
    lowYieldRunsCount: 3,
    usefulYieldRate: 0.02,
    confirmationRunsWithoutUsefulVolume: 1
  });

  assert.equal(result.stage, "exhausted_final");
  assert.equal(result.shouldMarkExhausted, true);
  assert.ok(result.score >= 82);
});