import assert from "node:assert/strict";
import test from "node:test";

import {
  generateCancellationPolicy,
  getCancellationPolicyForProfessional
} from "../../src/lib/booking/cancellation-policy";

test("generateCancellationPolicy clamps days and converts to hours", () => {
  assert.match(generateCancellationPolicy(2), /48 ore/);
  assert.match(generateCancellationPolicy(365), /8760 ore/);
});

test("generateCancellationPolicy defaults to 60 days when null", () => {
  assert.match(generateCancellationPolicy(null), /1440 ore/);
});

test("generateCancellationPolicy treats zero as default window", () => {
  assert.match(generateCancellationPolicy(0), /1440 ore/);
});

test("getCancellationPolicyForProfessional delegates to generateCancellationPolicy", () => {
  assert.equal(
    getCancellationPolicyForProfessional(1),
    generateCancellationPolicy(1)
  );
});
