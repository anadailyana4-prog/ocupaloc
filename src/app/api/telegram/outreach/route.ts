import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/config/env";
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
  if (!isValidTelegramSecret(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  // after() runs AFTER the response is sent to Telegram.
  // This means Telegram gets 200 immediately and never retries,
  // while the handler (which can take >5s for /scrape) still completes.
  after(async () => {
    try {
      await handleTelegramUpdate(payload as Parameters<typeof handleTelegramUpdate>[0]);
    } catch (error) {
      reportError("cron", "telegram_outreach_webhook_failed", error);
    }
  });

  return NextResponse.json({ ok: true });
}