import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";

test("normalize-supabase-db-url converts pooler to direct 5432", () => {
  const pooler =
    "postgresql://postgres.abcdefghij:secret@aws-0-eu-central-1.pooler.supabase.com:6543/postgres";
  const result = spawnSync("python3", ["scripts/normalize-supabase-db-url.py", pooler], {
    encoding: "utf-8"
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /db\.abcdefghij\.supabase\.co:5432/);
  assert.doesNotMatch(result.stdout, /pooler/);
  assert.doesNotMatch(result.stdout, /6543/);
});
