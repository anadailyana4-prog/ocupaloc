import { readFileSync } from "node:fs";

import { env } from "../src/lib/config/env";
import { TELEGRAM_TOOL_COMMANDS } from "../src/lib/outreach/ops-constants";

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
    // skip missing file
  }
}

function getTelegramApiBase() {
  return `https://api.telegram.org/bot${env.get("TELEGRAM_BOT_TOKEN")}`;
}

async function telegramCall(method: string, payload: Record<string, unknown>) {
  const response = await fetch(`${getTelegramApiBase()}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram ${method} failed (${response.status}): ${body}`);
  }

  const json = (await response.json()) as { ok: boolean; description?: string };
  if (!json.ok) {
    throw new Error(`Telegram ${method} rejected payload: ${json.description ?? "unknown error"}`);
  }
}

async function main() {
  const secret = env.get("TELEGRAM_WEBHOOK_SECRET");
  const explicitWebhook = process.env.TELEGRAM_WEBHOOK_URL?.trim();
  const siteUrl = (env.optional("NEXT_PUBLIC_SITE_URL") ?? "").trim();
  const webhookUrl = explicitWebhook || (siteUrl ? `${siteUrl.replace(/\/$/, "")}/api/telegram/outreach` : "");

  if (!webhookUrl) {
    throw new Error("Lipseste TELEGRAM_WEBHOOK_URL sau NEXT_PUBLIC_SITE_URL pentru configurarea webhook-ului.");
  }

  await telegramCall("setWebhook", {
    url: webhookUrl,
    secret_token: secret,
    drop_pending_updates: false,
    allowed_updates: ["message"]
  });

  await telegramCall("setMyCommands", { commands: TELEGRAM_TOOL_COMMANDS });

  console.log("Telegram tools setup finalizat (email + WhatsApp + lead barber).");
  console.log(`Webhook: ${webhookUrl}`);
  console.log(`Comenzi setate: ${TELEGRAM_TOOL_COMMANDS.length}`);
  console.log("Lead barber in chat: 07xx xxx xxx | Nume frizerie");
}

void main();