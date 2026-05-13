import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/config/env";
import { logInfo, logWarn } from "@/lib/logger";
import { reportError } from "@/lib/observability";
import { handleTelegramUpdate } from "@/lib/outreach/telegram-bot";

export const dynamic = "force-dynamic";
// Give slow commands (/scrape) up to 5 minutes to complete.
export const maxDuration = 300;

function isValidTelegramSecret(request: NextRequest) {
  const configured = env.optional("TELEGRAM_WEBHOOK_SECRET");
  if (!configured) {
    return true;
  }
  const header = request.headers.get("x-telegram-bot-api-secret-token")?.trim();
  return header === configured;
}

export async function POST(request: NextRequest) {
  logInfo("[telegram-outreach] POST received", {
    method: "POST",
    url: request.url
  });

  if (!isValidTelegramSecret(request)) {
    logWarn("[telegram-outreach] invalid webhook secret", {
      route: "/api/telegram/outreach"
    });
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (e) {
    logWarn("[telegram-outreach] json parse failed", { error: String(e) });
    return NextResponse.json({ ok: true });
  }

  logInfo("[telegram-outreach] parsed payload", {
    hasMessage: (payload as Record<string, unknown>)?.message !== undefined,
    hasText: ((payload as Record<string, unknown>)?.message as Record<string, unknown>)?.text !== undefined
  });

  const update = payload as Parameters<typeof handleTelegramUpdate>[0];
  const text = update.message?.text?.trim() ?? "";
  const command = text.split(/\s+/)[0]?.split("@")[0]?.toLowerCase() ?? "";

  logInfo("[telegram-outreach] command detected", { command, text });

  logInfo("[telegram-outreach] running command sync", { command });
  try {
    await handleTelegramUpdate(update);
    logInfo("[telegram-outreach] command completed", { command });
  } catch (error) {
    logWarn("[telegram-outreach] command failed", { command, error: String(error) });
    reportError("cron", "telegram_outreach_webhook_failed", error);
  }

  return NextResponse.json({ ok: true });
}