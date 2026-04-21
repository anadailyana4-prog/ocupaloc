import assert from "node:assert/strict";
import test from "node:test";

import { BILLING_LOGIN_PATH, buildBillingLoginRedirect } from "../src/lib/billing/login";

test("billing login redirect points to canonical login route", () => {
  assert.equal(BILLING_LOGIN_PATH, "/login");

  const target = buildBillingLoginRedirect("https://ocupaloc.ro");
  assert.equal(target.toString(), "https://ocupaloc.ro/login");
});
