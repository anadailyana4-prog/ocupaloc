#!/usr/bin/env node
/**
 * Runs all Node test runner files under tests/ (excluding Playwright e2e).
 */
import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function collectTests(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "e2e") continue;
      files.push(...collectTests(full));
    } else if (name.endsWith(".test.ts") || name.endsWith(".test.tsx")) {
      files.push(full);
    }
  }
  return files.sort();
}

/** Vitest-only or environment-specific — see vitest.config.ts / test:ci */
const SKIP = new Set([
  "tests/billing.test.ts",
  "tests/owner-portal.test.ts",
  "tests/reminder-schedule.test.ts",
  "tests/send-reminders-concurrency.test.ts",
  "tests/pg-url-for-ci.test.ts"
]);

const files = collectTests("tests").filter((f) => !SKIP.has(f));
if (files.length === 0) {
  console.error("No unit test files found.");
  process.exit(1);
}

const result = spawnSync("node", ["--import", "tsx", "--test", ...files], {
  stdio: "inherit",
  env: process.env
});

process.exit(result.status ?? 1);
