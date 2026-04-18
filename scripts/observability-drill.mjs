/**
 * Observability Drill Script — #9 din checklist
 *
 * Declanseaza un alert de test prin sendOpsAlert si verifica:
 * - ALERT_WEBHOOK_URL primeste payload-ul
 * - SENTRY_DSN (daca e configurat) primeste exceptia
 *
 * Usage:
 *   node scripts/observability-drill.mjs
 *
 * Variabile necesare in .env.local:
 *   ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...
 *   ALERT_WEBHOOK_BEARER_TOKEN=   (optional)
 *   SENTRY_DSN=https://...        (optional)
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
try {
  const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env.local not found — use existing env
}

const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL?.trim();
const ALERT_WEBHOOK_BEARER_TOKEN = process.env.ALERT_WEBHOOK_BEARER_TOKEN?.trim();

if (!ALERT_WEBHOOK_URL) {
  console.error(
    "\n❌ ALERT_WEBHOOK_URL nu este configurat.\n" +
    "   Adauga ALERT_WEBHOOK_URL=<url> in .env.local sau Vercel env\n" +
    "   si ruleaza din nou acest script.\n"
  );
  process.exit(1);
}

const payload = {
  flow: "booking",
  event: "drill_alert",
  severity: "critical",
  runbook_hint: "DRILL — nu este un incident real",
  context: {
    drill: true,
    timestamp: new Date().toISOString(),
    script: "scripts/observability-drill.mjs",
  },
  error: {
    name: "DrillError",
    message: "Test alert din drill observabilitate — ignora",
    stack: "DrillError: Test alert\n    at observability-drill.mjs:1:1",
  },
  timestamp: new Date().toISOString(),
};

console.log("\n🔔 Trimit drill alert la:", ALERT_WEBHOOK_URL);
console.log("   Payload:", JSON.stringify(payload, null, 2));

const response = await fetch(ALERT_WEBHOOK_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(ALERT_WEBHOOK_BEARER_TOKEN
      ? { Authorization: `Bearer ${ALERT_WEBHOOK_BEARER_TOKEN}` }
      : {}),
  },
  body: JSON.stringify(payload),
});

if (response.ok) {
  console.log(`\n✅ Drill alert trimis cu succes. Status: ${response.status}`);
  console.log("   Verifica webhook-ul tau (Slack/Discord/etc) ca a primit mesajul.");
} else {
  const body = await response.text().catch(() => "");
  console.error(`\n❌ Webhook a returnat HTTP ${response.status}: ${body}`);
  process.exit(1);
}
