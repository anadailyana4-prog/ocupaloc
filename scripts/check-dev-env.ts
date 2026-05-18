import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type EnvMap = Map<string, string>;

const DEV_BASE_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "RESEND_API_KEY",
  "RESEND_FROM",
  "REMINDERS_CRON_SECRET"
] as const;

const DEV_BILLING_KEYS = [
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_ID"
] as const;

function parseEnvFile(filePath: string): EnvMap {
  const map: EnvMap = new Map();
  if (!existsSync(filePath)) {
    return map;
  }

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value.length > 0) {
      map.set(key, value);
    }
  }
  return map;
}

function checkNodeVersion(): boolean {
  const major = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
  if (major < 22) {
    console.error(`❌ Node.js 22+ necesar (ai ${process.versions.node}). Folosește .nvmrc.`);
    return false;
  }
  console.log(`✅ Node.js ${process.versions.node}`);
  return true;
}

function main(): void {
  const repoRoot = process.cwd();
  const envPath = join(repoRoot, ".env.local");
  const examplePath = join(repoRoot, ".env.example");

  let ok = checkNodeVersion();

  if (!existsSync(envPath)) {
    console.error("❌ Lipsește .env.local");
    console.error(`   cp ${examplePath} .env.local`);
    console.error("   Apoi completează valorile — vezi docs/DEV_SETUP.md");
    process.exit(1);
  }

  const env = parseEnvFile(envPath);
  const billingEnabled = env.get("BILLING_ENABLED")?.toLowerCase() === "true";
  const required = billingEnabled
    ? [...DEV_BASE_KEYS, ...DEV_BILLING_KEYS]
    : [...DEV_BASE_KEYS];

  const missing: string[] = [];
  for (const key of required) {
    if (!env.has(key)) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    ok = false;
    console.error("❌ Variabile lipsă sau goale în .env.local:");
    for (const key of missing) {
      console.error(`   - ${key}`);
    }
  } else {
    console.log(
      `✅ .env.local complet (${billingEnabled ? "billing activ" : "billing dezactivat"})`
    );
  }

  const siteUrl = env.get("NEXT_PUBLIC_SITE_URL");
  if (siteUrl && !siteUrl.includes("8788") && !siteUrl.includes("ocupaloc.ro")) {
    console.warn(
      "⚠️ NEXT_PUBLIC_SITE_URL nu folosește portul 8788 — dev rulează pe http://127.0.0.1:8788"
    );
  }

  if (!ok) {
    console.error("\nGhid complet: docs/DEV_SETUP.md");
    process.exit(1);
  }

  console.log("\nGata pentru: pnpm run dev  →  http://127.0.0.1:8788");
}

main();
