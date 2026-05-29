import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("prepare-backup-db-url rejects cli_login pooler user", () => {
  const url =
    "postgresql://cli_login_postgres.tffwoljimpdckvlogyqu:secret@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";
  const dir = mkdtempSync(join(tmpdir(), "backup-pg-cli-"));
  const out = join(dir, "nope.env");
  try {
    const result = spawnSync("python3", ["scripts/prepare-backup-db-url.py", url, out], {
      encoding: "utf-8",
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /cli_login_postgres/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

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
    assert.match(env, /PGHOST=\d{1,3}(?:\.\d{1,3}){3}/);
    assert.doesNotMatch(env, /eu-central/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
