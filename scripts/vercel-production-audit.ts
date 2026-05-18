/**
 * Audits Vercel production env keys expected by OcupaLoc (names only, no values).
 * Usage: pnpm exec tsx scripts/vercel-production-audit.ts
 */
import { execSync } from "node:child_process";

const REQUIRED_PRODUCTION = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "RESEND_API_KEY",
  "RESEND_FROM",
  "REMINDERS_CRON_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID"
] as const;

const RECOMMENDED_PRODUCTION = [
  "BILLING_CRON_SECRET",
  "OWNER_OPS_CRON_SECRET",
  "RELEASE_GUARD_SECRET",
  "SYNTHETIC_MONITOR_SECRET",
  "SEO_CRON_SECRET",
  "GOOGLE_INDEXING_CLIENT_EMAIL",
  "GOOGLE_INDEXING_PRIVATE_KEY",
  "GOOGLE_INDEXING_SITEMAP_URL",
  "BOOKING_CONFIRMATION_SECRET",
  "BILLING_ENABLED"
] as const;

function listProductionEnvNames(): Set<string> {
  const out = execSync("npx vercel@latest env ls production", {
    cwd: process.cwd(),
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "inherit"]
  });
  const names = new Set<string>();
  for (const line of out.split("\n")) {
    const match = line.trim().match(/^([A-Z0-9_]+)\s+/);
    if (match) names.add(match[1]);
  }
  return names;
}

function main() {
  console.log("\n=== Vercel Production Env Audit (ocupaloc) ===\n");
  let failed = 0;
  const present = listProductionEnvNames();

  for (const key of REQUIRED_PRODUCTION) {
    const ok = present.has(key);
    console.log(`${ok ? "✅" : "❌"} ${key}${ok ? "" : " — MISSING"}`);
    if (!ok) failed += 1;
  }

  console.log("\nRecommended:");
  for (const key of RECOMMENDED_PRODUCTION) {
    const ok = present.has(key);
    console.log(`${ok ? "✅" : "⚠️ "} ${key}${ok ? "" : " — add before enabling feature"}`);
  }

  console.log("\nProject: https://vercel.com/anadailyana4-progs-projects/ocupaloc");
  console.log("Production URL: https://ocupaloc.ro");
  process.exit(failed > 0 ? 1 : 0);
}

main();
