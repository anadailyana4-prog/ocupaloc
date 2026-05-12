/**
 * GET /api/leads/unsubscribe?token=<base64url>
 * HMAC-signed unsubscribe link for GDPR compliance.
 * Token = base64url( leadId + ":" + hmac_sha256(leadId, OUTREACH_SIGNING_SECRET) )
 */
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/config/env";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const signingSecret = env.optional("OUTREACH_SIGNING_SECRET");
  if (!signingSecret) {
    return new NextResponse("Unsubscribe service unavailable", { status: 503 });
  }

  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return new NextResponse("Token missing", { status: 400 });
  }

  let leadId: string;
  let providedMac: string;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const colonIdx = decoded.indexOf(":");
    if (colonIdx < 1) throw new Error("bad format");
    leadId = decoded.slice(0, colonIdx);
    providedMac = decoded.slice(colonIdx + 1);
  } catch {
    return new NextResponse("Invalid token", { status: 400 });
  }

  const expectedMac = crypto.createHmac("sha256", signingSecret).update(leadId).digest("hex");

  if (providedMac.length !== expectedMac.length) {
    return new NextResponse("Invalid token", { status: 400 });
  }

  const tokensMatch = crypto.timingSafeEqual(Buffer.from(expectedMac, "hex"), Buffer.from(providedMac, "hex"));

  if (!tokensMatch) {
    return new NextResponse("Invalid token", { status: 400 });
  }

  const admin = createSupabaseServiceClient();
  const { error } = await admin
    .from("outreach_leads")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("id", leadId)
    .neq("status", "unsubscribed"); // idempotent

  if (error) {
    return new NextResponse("Could not process request", { status: 500 });
  }

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"><title>Dezabonat — OcupaLoc.ro</title></head>
<body style="font-family: Arial, sans-serif; text-align: center; padding: 60px 20px; color: #333;">
  <h1 style="color: #2563eb;">OcupaLoc.ro</h1>
  <h2>Te-ai dezabonat cu succes</h2>
  <p>Nu vei mai primi mesaje de la noi pe aceasta adresa de email.</p>
  <p style="color: #64748b; font-size: 14px;">Daca te-ai dezabonat din greseala, ne poti contacta la <a href="mailto:contact@ocupaloc.ro">contact@ocupaloc.ro</a>.</p>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
