import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/config/env";
import { reportError } from "@/lib/observability";
import { handleTelegramUpdate } from "@/lib/outreach/telegram-bot";

export const dynamic = "force-dynamic";

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

  try {
    const payload = await request.json();
    const result = await handleTelegramUpdate(payload);
    return NextResponse.json(result);
  } catch (error) {
    reportError("cron", "telegram_outreach_webhook_failed", error);
    // Always return 200 to Telegram — a non-200 causes infinite retries
    return NextResponse.json({ ok: true, error: "internal error logged" });
  }
}