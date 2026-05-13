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

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  // Respond immediately with 200 so Telegram doesn't retry.
  // Run the handler in the background (waitUntil keeps the function alive on Vercel).
  const handler = handleTelegramUpdate(payload as Parameters<typeof handleTelegramUpdate>[0])
    .catch((error) => {
      reportError("cron", "telegram_outreach_webhook_failed", error);
    });

  // @ts-expect-error waitUntil is available on Vercel Edge/Node runtimes via globalThis
  if (typeof globalThis.waitUntil === "function") {
    (globalThis as unknown as { waitUntil: (p: Promise<unknown>) => void }).waitUntil(handler);
  } else {
    // Fallback: fire-and-forget (Vercel Fluid/Lambda keeps alive long enough)
    void handler;
  }

  return NextResponse.json({ ok: true });
}