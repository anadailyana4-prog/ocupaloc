import assert from "node:assert/strict";
import test from "node:test";

import { getAuthBridgeAction, getErrorMessage, getSafeNext } from "../src/lib/supabase/auth-bridge";

test("getSafeNext keeps only local paths", () => {
  assert.equal(getSafeNext("/dashboard"), "/dashboard");
  assert.equal(getSafeNext("https://evil.example"), "/dashboard");
  assert.equal(getSafeNext("//evil.example"), "/dashboard");
  assert.equal(getSafeNext(null), "/dashboard");
});

test("getAuthBridgeAction prioritizes code exchange when code is present", () => {
  const url = new URL("https://ocupaloc.ro/auth/bridge?code=abc123&token_hash=ignored&type=magiclink");
  const action = getAuthBridgeAction(url);

  assert.deepEqual(action, { kind: "code", code: "abc123" });
});

test("getAuthBridgeAction reads token_hash and type from query or hash", () => {
  const url = new URL("https://ocupaloc.ro/auth/bridge#token_hash=hash123&type=magiclink");
  const action = getAuthBridgeAction(url);

  assert.deepEqual(action, { kind: "otp", tokenHash: "hash123", otpType: "magiclink" });
});

test("getAuthBridgeAction falls back to access and refresh tokens", () => {
  const url = new URL("https://ocupaloc.ro/auth/bridge#access_token=at&refresh_token=rt");
  const action = getAuthBridgeAction(url);

  assert.deepEqual(action, { kind: "session", accessToken: "at", refreshToken: "rt" });
});

test("getAuthBridgeAction returns none when callback payload is incomplete", () => {
  const url = new URL("https://ocupaloc.ro/auth/bridge?token_hash=hash-only");
  const action = getAuthBridgeAction(url);

  assert.deepEqual(action, { kind: "none" });
});

test("getErrorMessage normalizes unknown errors", () => {
  assert.equal(getErrorMessage(new Error("boom")), "boom");
  assert.equal(getErrorMessage("plain"), "plain");
  assert.equal(getErrorMessage({ foo: "bar" }), "auth_bridge_failed");
});