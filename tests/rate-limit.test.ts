import assert from "node:assert/strict";
import test from "node:test";

import type { SupabaseClient } from "@supabase/supabase-js";

import { checkApiRateLimit } from "../src/lib/rate-limit";

test("checkApiRateLimit returns true when DB allows", async () => {
  const admin = {
    rpc: async () => ({ data: true, error: null })
  } as unknown as SupabaseClient;

  const result = await checkApiRateLimit(admin, "k", 10, 60_000);
  assert.equal(result.allowed, true);
});

test("checkApiRateLimit fails closed by default when RPC errors", async () => {
  const admin = {
    rpc: async () => ({ data: null, error: { message: "db down" } })
  } as unknown as SupabaseClient;

  const result = await checkApiRateLimit(admin, "k", 10, 60_000);
  assert.equal(result.allowed, false);
});

test("checkApiRateLimit can fail open only when explicitly enabled", async () => {
  const admin = {
    rpc: async () => ({ data: null, error: { message: "db down" } })
  } as unknown as SupabaseClient;

  const result = await checkApiRateLimit(admin, "k", 10, 60_000, { failOpen: true });
  assert.equal(result.allowed, true);
});
