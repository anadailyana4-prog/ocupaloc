import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";

test("pg-url-for-ci leaves pooler URLs unchanged", () => {
  const url = "postgresql://postgres.x:pass@aws-0-eu.pooler.supabase.com:6543/postgres";
  const result = spawnSync("python3", ["scripts/pg-url-for-ci.py", url], { encoding: "utf-8" });
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), url);
});
