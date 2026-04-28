import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type SignupFallbackBody = {
  email?: unknown;
  password?: unknown;
  fullName?: unknown;
  phone?: unknown;
  activity?: unknown;
  redirectTo?: unknown;
};

function isAlreadyRegisteredError(message: string) {
  const text = message.toLowerCase();
  return text.includes("already") || text.includes("registered") || text.includes("exists");
}

export async function POST(req: NextRequest) {
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