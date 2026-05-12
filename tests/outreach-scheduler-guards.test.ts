import assert from "node:assert/strict";
import test from "node:test";

import { computeBatchCapacity, shouldSkipFollowUp } from "../src/lib/outreach/scheduler";

test("computeBatchCapacity applies 10/h and 50/day style limits", () => {
  assert.equal(
    computeBatchCapacity({
      perHourLimit: 10,
      perDayLimit: 50,
      maxBatchSize: 10,
      sentLastHour: 3,
      sentToday: 20
    }),
    7
  );

  assert.equal(
    computeBatchCapacity({
      perHourLimit: 10,
      perDayLimit: 50,
      maxBatchSize: 10,
      sentLastHour: 10,
      sentToday: 20
    }),
    0
  );

  assert.equal(
    computeBatchCapacity({
      perHourLimit: 10,
      perDayLimit: 50,
      maxBatchSize: 10,
      sentLastHour: 2,
      sentToday: 50
    }),
    0
  );
});

test("shouldSkipFollowUp blocks suppressed, replied and closed leads", () => {
  assert.equal(
    shouldSkipFollowUp({
      qualificationStatus: "suppressed",
      isSuppressed: true,
      hasReplyEvent: false
    }),
    true
  );

  assert.equal(
    shouldSkipFollowUp({
      qualificationStatus: "replied",
      isSuppressed: false,
      hasReplyEvent: false
    }),
    true
  );

  assert.equal(
    shouldSkipFollowUp({
      qualificationStatus: "qualified",
      isSuppressed: false,
      hasReplyEvent: true
    }),
    true
  );

  assert.equal(
    shouldSkipFollowUp({
      qualificationStatus: "qualified",
      isSuppressed: false,
      hasReplyEvent: false
    }),
    false
  );
});