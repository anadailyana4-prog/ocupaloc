/**
 * Dry-run: creează demo barber + mesaj WhatsApp fără Telegram.
 * Usage: pnpm exec tsx scripts/test-telegram-barber-lead.ts "0722123456" "Barber Test Ion"
 */
import { readFileSync } from "node:fs";

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
    // skip
  }
}

import { handleTelegramBarberLead } from "../src/lib/outreach/telegram-barber-lead";

async function main() {
  const phone = process.argv[2] ?? "0722000000";
  const businessName = process.argv[3] ?? "Barber Demo Test";
  const output = await handleTelegramBarberLead({ phone, businessName });
  console.log(output);
}

void main();
