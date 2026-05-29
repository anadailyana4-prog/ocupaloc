import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { checkApiRateLimit } from "@/lib/rate-limit";

type SignupFallbackBody = {
  email?: unknown;
  password?: unknown;
  fullName?: unknown;
  phone?: unknown;
  activity?: unknown;
  redirectTo?: unknown;
};

const PER_IP_MAX = 10;
const PER_EMAIL_MAX = 3;
const WINDOW_MS = 10 * 60 * 1000;

function isAlreadyRegisteredError(message: string) {
  const text = message.toLowerCase();
  return text.includes("already") || text.includes("registered") || text.includes("exists");
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const xr = req.headers.get("x-real-ip")?.trim();
  return xff || xr || "unknown";
}

function hashEmail(email: string): string {
  return createHash("sha256").update(email).digest("hex").slice(0, 24);
}

// Respinge cereri cross-origin (CSRF / abuz din alte site-uri). Permite cererile
// fără header Origin (ex. unele clienți server-to-server) ca să nu stricăm fluxuri legitime.
function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  try {
    const originHost = new URL(origin).host;
    const requestHost = req.headers.get("host") ?? "";
    if (originHost === requestHost) return true;
    if (siteUrl && originHost === new URL(siteUrl).host) return true;
    return false;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, message: "Cerere respinsă." }, { status: 403 });
  }

  const ip = getClientIp(req);
  let ipAllowed = true;
  try {
    const admin = createSupabaseServiceClient();
    const ipRl = await checkApiRateLimit(admin, `auth:signup:ip:${ip}`, PER_IP_MAX, WINDOW_MS);
    ipAllowed = ipRl.allowed;
  } catch (error) {
    console.error("[auth:signup-fallback] rate-limit setup error:", error);
  }

  if (!ipAllowed) {
    return NextResponse.json(
      { ok: false, message: "Prea multe încercări. Reîncearcă în câteva minute." },
      { status: 429 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as SignupFallbackBody;

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const fullName = String(body.fullName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const activity = String(body.activity ?? "").trim();
  const redirectTo = String(body.redirectTo ?? "").trim();

  if (!email || !password || !fullName) {
    return NextResponse.json({ ok: false, message: "Date de signup invalide." }, { status: 400 });
  }

  let emailAllowed = true;
  try {
    const admin = createSupabaseServiceClient();
    const emailRl = await checkApiRateLimit(
      admin,
      `auth:signup:email:${hashEmail(email)}`,
      PER_EMAIL_MAX,
      WINDOW_MS
    );
    emailAllowed = emailRl.allowed;
  } catch (error) {
    console.error("[auth:signup-fallback] email rate-limit error:", error);
  }

  if (!emailAllowed) {
    return NextResponse.json(
      { ok: false, message: "Prea multe încercări. Reîncearcă în câteva minute." },
      { status: 429 }
    );
  }

  try {
    const admin = createSupabaseServiceClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          activity
        },
        redirectTo: redirectTo || undefined
      }
    });

    if (error) {
      if (isAlreadyRegisteredError(error.message ?? "")) {
        return NextResponse.json(
          { ok: false, code: "already_registered", message: "Emailul este deja înregistrat." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { ok: false, message: "Nu am putut pregăti emailul de confirmare." },
        { status: 502 }
      );
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      return NextResponse.json(
        { ok: false, message: "Lipsește linkul de confirmare." },
        { status: 502 }
      );
    }

    const resendKey = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM ?? "OcupaLoc <onboarding@resend.dev>";
    if (!resendKey) {
      return NextResponse.json(
        { ok: false, message: "Email provider indisponibil momentan." },
        { status: 500 }
      );
    }

    const mailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [email],
        subject: "Confirm Your Signup",
        html: `<h2>Confirm your signup</h2><p>Follow this link to confirm your user:</p><p><a href=\"${actionLink}\">Confirm your mail</a></p>`,
        text: `CONFIRM YOUR SIGNUP\n\nFollow this link to confirm your user:\n\n${actionLink}`
      })
    });

    if (!mailResponse.ok) {
      return NextResponse.json(
        { ok: false, message: "Nu am putut trimite emailul de confirmare." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[auth:signup-fallback] failed:", error);
    return NextResponse.json(
      { ok: false, message: "Eroare internă la trimiterea emailului de confirmare." },
      { status: 500 }
    );
  }
}