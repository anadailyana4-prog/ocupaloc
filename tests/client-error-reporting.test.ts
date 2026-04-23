import assert from "node:assert/strict";
import test from "node:test";

import { serializeClientError } from "../src/lib/client-error-reporting";

test("serializeClientError keeps digest and scope for ocupaloc UI errors", () => {
  const error = new Error("boom");
  const payload = serializeClientError("dashboard", error, { digest: "abc123" });

  assert.equal(payload.scope, "dashboard");
  assert.equal(payload.digest, "abc123");
  assert.equal(payload.name, "Error");
  assert.equal(payload.message, "boom");
  assert.equal(typeof payload.stack, "string");
});