import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";

test("pg-url-for-ci exits cleanly for pooler host when IPv4 resolves", () => {
  const url = "postgresql://postgres.x:pass@aws-0-eu-central-1.pooler.supabase.com:6543/postgres";
  const result = spawnSync("python3", ["scripts/pg-url-for-ci.py", url], { encoding: "utf-8" });
  assert.equal(result.status, 0);
  assert.match(result.stdout.trim(), /^postgresql:\/\//);
});
