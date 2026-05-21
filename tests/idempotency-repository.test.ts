import assert from "node:assert/strict";
import test from "node:test";

import type { SupabaseClient } from "@supabase/supabase-js";

import { findIdempotencyResult, saveIdempotencyResult } from "../src/lib/repositories/idempotency-repository";

test("findIdempotencyResult returns parsed result when row is fresh", async () => {
  const stubResult = { success: true, error: null };
  const admin = {
    from: () => ({
      select: () => ({
        eq: () => ({
          gt: () => ({
            maybeSingle: async () => ({ data: { result: stubResult }, error: null })
          })
        })
      })
    })
  } as unknown as SupabaseClient;

  const out = await findIdempotencyResult("key-1", admin);
  assert.deepEqual(out, stubResult);
});

test("findIdempotencyResult returns null when no row", async () => {
  const admin = {
    from: () => ({
      select: () => ({
        eq: () => ({
          gt: () => ({
            maybeSingle: async () => ({ data: null, error: null })
          })
        })
      })
    })
  } as unknown as SupabaseClient;

  assert.equal(await findIdempotencyResult("missing", admin), null);
});

test("findIdempotencyResult throws on Supabase error", async () => {
  const admin = {
    from: () => ({
      select: () => ({
        eq: () => ({
          gt: () => ({
            maybeSingle: async () => ({
              data: null,
              error: { message: "permission denied" }
            })
          })
        })
      })
    })
  } as unknown as SupabaseClient;

  await assert.rejects(() => findIdempotencyResult("bad", admin), /idempotency lookup failed/);
});

test("saveIdempotencyResult upserts with 24h expiry", async () => {
  const captured: { row?: Record<string, unknown> } = {};
  const admin = {
    from: () => ({
      upsert: async (row: Record<string, unknown>) => {
        captured.row = row;
        return { error: null };
      }
    })
  } as unknown as SupabaseClient;

  await saveIdempotencyResult("save-key", { ok: true }, admin);
  assert.ok(captured.row);
  assert.equal(captured.row.key, "save-key");
  assert.deepEqual(captured.row.result, { ok: true });
  assert.ok(typeof captured.row.expiresat === "string");
});

test("saveIdempotencyResult throws on upsert error", async () => {
  const admin = {
    from: () => ({
      upsert: async () => ({ error: { message: "dup" } })
    })
  } as unknown as SupabaseClient;

  await assert.rejects(
    () => saveIdempotencyResult("k", { a: 1 }, admin),
    /idempotency save failed/
  );
});
