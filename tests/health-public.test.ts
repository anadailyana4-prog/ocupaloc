import assert from "node:assert/strict";
import test from "node:test";

import { buildPublicHealthPayload } from "../src/lib/health/public-health";

test("public health payload does not expose sensitive checks", () => {
  const payload = buildPublicHealthPayload(true) as Record<string, unknown>;

  assert.deepEqual(Object.keys(payload).sort(), ["ok", "timestamp"]);
  assert.equal(payload.ok, true);
  assert.equal(typeof payload.timestamp, "string");
});
