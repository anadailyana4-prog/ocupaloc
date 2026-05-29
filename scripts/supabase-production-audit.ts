/**
 * Read-only + optional apply audit for Supabase production alignment.
 * Usage:
 *   pnpm exec tsx scripts/supabase-production-audit.ts
 *   pnpm exec tsx scripts/supabase-production-audit.ts --apply-missing
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

for (const envFile of [".env.local", ".env"]) {
  try {
    const lines = readFileSync(envFile, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx < 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !(key in process.env)) process.env[key] = val;
    }
  } catch {
    /* skip */
  }
}

import { createClient } from "@supabase/supabase-js";

type Check = { name: string; ok: boolean; details?: string };

const REQUIRED_TABLES = [
  "profesionisti",
  "servicii",
  "programari",
  "profiles",
  "subscriptions",
  "operational_events",
  "tenants",
  "memberships"
] as const;

const PROF_COLUMNS = [
  "onboarding_completed_at",
  "first_booking_at",
  "onboarding_pas",
  "bio",
  "telefon",
  "whatsapp"
] as const;

const MIGRATION_FILES_FROM_047 = [
  "047_subscriptions_status_commercial_guard.sql",
  "048_subscriptions_status_guard_cleanup_and_validate.sql",
  "049_profesionisti_public_add_bio.sql",
  "050_professional_milestones_backfill.sql",
  "051_drop_outreach_pipeline.sql",
  "052_remove_galerie_storage.sql",
  "053_backfill_profesionist_email_contact.sql",
  "055_fix_booking_overlap_and_reactivated.sql",
  "056_booking_billing_enabled_flag.sql",
  "057_align_booking_rpc_trial_days.sql"
] as const;

/** Kept after 051 — Telegram manual email tools */
const TELEGRAM_TOOL_TABLES = ["telegram_admins", "suppression_list"] as const;

function loadEnv() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

async function tableExists(admin: ReturnType<typeof loadEnv>, table: string): Promise<boolean> {
  const { error } = await admin.from(table).select("*", { head: true, count: "exact" });
  return !error;
}

async function columnExists(admin: ReturnType<typeof loadEnv>, table: string, column: string): Promise<boolean> {
  const { error } = await admin.from(table).select(column).limit(1);
  if (!error) return true;
  const msg = (error.message ?? "").toLowerCase();
  return !msg.includes("column") && !msg.includes("does not exist");
}

async function runAudit(): Promise<{ checks: Check[]; apply: boolean }> {
  const apply = process.argv.includes("--apply-missing");
  const admin = loadEnv();
  const checks: Check[] = [];

  const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  checks.push({
    name: "Project ref",
    ok: Boolean(projectRef),
    details: projectRef ?? "unknown"
  });

  for (const table of REQUIRED_TABLES) {
    const ok = await tableExists(admin, table);
    checks.push({
      name: `Table ${table}`,
      ok,
      details: ok ? undefined : "missing or inaccessible"
    });
  }

  for (const col of PROF_COLUMNS) {
    const ok = await columnExists(admin, "profesionisti", col);
    checks.push({
      name: `profesionisti.${col}`,
      ok,
      details: ok ? undefined : "column missing — run migrations 036+ / 049"
    });
  }

  for (const table of TELEGRAM_TOOL_TABLES) {
    const ok = await tableExists(admin, table);
    checks.push({
      name: `Telegram tool table ${table}`,
      ok,
      details: ok ? undefined : "missing — run 051 only if you dropped outreach; telegram_admins required"
    });
  }

  const { error: leadsProbeError } = await admin.from("leads").select("id").limit(1);
  const outreachGone = Boolean(leadsProbeError?.message?.includes("Could not find the table"));
  checks.push({
    name: "Outreach pipeline",
    ok: true,
    details: outreachGone
      ? "removed (051 applied)"
      : "legacy tables still present — run 051_drop_outreach_pipeline.sql in SQL Editor when ready"
  });

  const { count: profCount } = await admin.from("profesionisti").select("id", { count: "exact", head: true });
  const { count: withOnboarding } = await admin
    .from("profesionisti")
    .select("id", { count: "exact", head: true })
    .not("onboarding_completed_at", "is", null);
  const { count: withFirstBooking } = await admin
    .from("profesionisti")
    .select("id", { count: "exact", head: true })
    .not("first_booking_at", "is", null);

  checks.push({
    name: "Data: profesionisti count",
    ok: true,
    details: String(profCount ?? 0)
  });
  checks.push({
    name: "Data: with onboarding_completed_at",
    ok: true,
    details: String(withOnboarding ?? 0)
  });
  checks.push({
    name: "Data: with first_booking_at",
    ok: true,
    details: String(withFirstBooking ?? 0)
  });

  const { data: buckets, error: bucketError } = await admin.storage.listBuckets();
  const hasLogos = !bucketError && (buckets ?? []).some((b) => b.name === "logos");
  checks.push({
    name: "Storage bucket logos",
    ok: hasLogos,
    details: hasLogos ? undefined : "create logos bucket in Supabase Storage dashboard"
  });

  const { data: publicProf, error: viewError } = await admin.from("profesionisti_public").select("id, bio").limit(1);
  checks.push({
    name: "View profesionisti_public (+ bio)",
    ok: !viewError,
    details: viewError?.message
  });

  if (publicProf) {
    checks[checks.length - 1].details = "ok";
  }

  return { checks, apply };
}

async function applyMissingMigrations(admin: ReturnType<typeof loadEnv>) {
  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  for (const file of MIGRATION_FILES_FROM_047) {
    const fullPath = path.join(migrationsDir, file);
    const sql = readFileSync(fullPath, "utf-8");
    console.log(`\nApplying ${file} via RPC exec_sql if available...`);

    const { error } = await admin.rpc("exec_sql", { query: sql });
    if (error) {
      console.warn(`  exec_sql not available or failed for ${file}: ${error.message}`);
      console.warn(`  → Run manually in Supabase SQL Editor: ${fullPath}`);
    } else {
      console.log(`  ✓ ${file}`);
    }
  }
}

async function main() {
  const { checks, apply } = await runAudit();

  console.log("\n=== Supabase Production Audit ===\n");
  let failed = 0;
  for (const c of checks) {
    const icon = c.ok ? "✅" : "❌";
    console.log(`${icon} ${c.name}${c.details ? ` — ${c.details}` : ""}`);
    if (!c.ok) failed += 1;
  }

  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  const allMigrations = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  console.log(`\nMigrations in repo: ${allMigrations.length} (latest: ${allMigrations.at(-1)})`);

  if (apply) {
    const admin = loadEnv();
    await applyMissingMigrations(admin);
    console.log("\nRe-run audit after manual SQL if any migration failed.");
  } else {
    console.log("\nTo attempt apply: pnpm exec tsx scripts/supabase-production-audit.ts --apply-missing");
    console.log("Recommended: run 047-049 in SQL Editor if any column check failed.");
  }

  console.log(`\nAuth checklist (manual in dashboard):`);
  console.log(`  https://supabase.com/dashboard/project/${checks[0].details}/auth/url-configuration`);
  console.log(`  Site URL: https://www.ocupaloc.ro`);
  console.log(`  Redirects: https://ocupaloc.ro/** https://www.ocupaloc.ro/** http://localhost:8788/**`);

  process.exit(failed > 0 ? 1 : 0);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
