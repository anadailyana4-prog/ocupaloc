import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("prepare-backup-db-url maps eu-central pooler to eu-west for production ref", () => {
  const url =
    "postgresql://postgres.tffwoljimpdckvlogyqu:secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres";
  const dir = mkdtempSync(join(tmpdir(), "backup-pg-"));
  const out = join(dir, "backup-pg.env");
  try {
    const result = spawnSync("python3", ["scripts/prepare-backup-db-url.py", url, out], {
      encoding: "utf-8",
    });
    assert.equal(result.status, 0, result.stderr);
    const env = readFileSync(out, "utf-8");
    assert.match(env, /PGUSER=postgres\.tffwoljimpdckvlogyqu/);
    assert.match(env, /PGHOST=34\.241\.16\.247/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
