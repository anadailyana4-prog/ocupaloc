import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { checkApiRateLimit } from "@/lib/rate-limit";

const PER_IP_MAX = 20;
const PER_EMAIL_MAX = 5;
const WINDOW_MS = 10 * 60 * 1000;

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const xr = req.headers.get("x-real-ip")?.trim();
  return xff || xr || "unknown";
}

function hashEmail(email: string): string {
  return createHash("sha256").update(email).digest("hex").slice(0, 24);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  let ipAllowed = true;
  try {
    const admin = createSupabaseServiceClient();
    const ipRl = await checkApiRateLimit(admin, `auth:reset:ip:${ip}`, PER_IP_MAX, WINDOW_MS);
    ipAllowed = ipRl.allowed;
  } catch (error) {
    console.error("[auth:password-reset] rate-limit setup error:", error);
  }

  if (!ipAllowed) {
    return NextResponse.json(
      { ok: false, message: "Prea multe încercări. Reîncearcă în câteva minute." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const rawEmail = String((body as { email?: unknown }).email ?? "");
  const email = rawEmail.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ ok: true, message: "Dacă emailul există, am trimis instrucțiunile." });
  }

  let emailAllowed = true;
  try {
    const admin = createSupabaseServiceClient();
    const emailKey = hashEmail(email);
    const emailRl = await checkApiRateLimit(admin, `auth:reset:email:${emailKey}`, PER_EMAIL_MAX, WINDOW_MS);
    emailAllowed = emailRl.allowed;
  } catch (error) {
    console.error("[auth:password-reset] email rate-limit error:", error);
  }

  if (!emailAllowed) {
    return NextResponse.json(
      { ok: false, message: "Prea multe încercări. Reîncearcă în câteva minute." },
      { status: 429 }
    );
  }

  return NextResponse.json({ ok: true, message: "Dacă emailul există, am trimis instrucțiunile." });
}
