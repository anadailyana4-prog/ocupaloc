/**
 * GET /api/jobs/send-outreach
 * Sends personalized Romanian cold emails to outreach_leads with status='pending' and email set.
 * Protected by OUTREACH_CRON_SECRET.
 */
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/config/env";
import { validateCronSecret } from "@/lib/cron-auth";
import { sendResendEmail } from "@/lib/email/resend";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { reportError } from "@/lib/observability";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 10;

export async function GET(req: NextRequest) {
  const secret = env.optional("OUTREACH_CRON_SECRET");
  if (!validateCronSecret(req.headers, secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const signingSecret = env.optional("OUTREACH_SIGNING_SECRET");
  if (!signingSecret) {
    return NextResponse.json({ ok: false, error: "OUTREACH_SIGNING_SECRET not configured" }, { status: 503 });
  }

  const siteUrl = env.optional("NEXT_PUBLIC_SITE_URL") ?? "https://ocupaloc.ro";

  const admin = createSupabaseServiceClient();

  const { data: leads, error } = await admin
    .from("outreach_leads")
    .select("id, business_name, email, website, city, category")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    reportError("cron", "send_outreach_query_failed", error);
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 });
  }

  if (!leads || leads.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "No pending leads" });
  }

  let sent = 0;
  let failed = 0;
  let enriched = 0;
  let skippedNoEmail = 0;

  for (const lead of leads) {
    let email = lead.email ?? null;
    if (!email && lead.website) {
      email = await findEmailFromWebsite(lead.website);
      if (email) {
        enriched += 1;
        await admin.from("outreach_leads").update({ email }).eq("id", lead.id);
      }
    }

    if (!email) {
      skippedNoEmail += 1;
      continue;
    }

    const unsubToken = makeUnsubToken(lead.id, signingSecret);
    const unsubUrl = `${siteUrl}/api/leads/unsubscribe?token=${unsubToken}`;

    const { subject, text, html } = buildEmailContent({
      businessName: lead.business_name,
      city: lead.city ?? "București",
      category: lead.category ?? "frizerie",
      unsubUrl,
      siteUrl
    });

    try {
      await sendResendEmail({
        to: [email],
        subject,
        text,
        html,
        event: "outreach_barber_campaign"
      });

      await admin
        .from("outreach_leads")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", lead.id);

      sent++;
    } catch (err) {
      reportError("cron", "send_outreach_email_failed", err, { leadId: lead.id });

      await admin
        .from("outreach_leads")
        .update({ status: "failed" })
        .eq("id", lead.id);

      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed, enriched, skippedNoEmail, total: leads.length });
}

function makeUnsubToken(leadId: string, secret: string): string {
  const mac = crypto.createHmac("sha256", secret).update(leadId).digest("hex");
  return Buffer.from(`${leadId}:${mac}`).toString("base64url");
}

async function findEmailFromWebsite(website: string): Promise<string | null> {
  const candidates = buildCandidateUrls(website);

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, {
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; OcupaLocBot/1.0; +https://ocupaloc.ro)"
        }
      });

      if (!response.ok) continue;

      const text = await response.text();
      const email = extractEmail(text);
      if (email) return email;
    } catch {
      continue;
    }
  }

  return null;
}

function buildCandidateUrls(website: string): string[] {
  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    const base = `${url.protocol}//${url.host}`;
    return [
      url.toString(),
      `${base}/contact`,
      `${base}/contact-us`,
      `${base}/despre`,
      `${base}/despre-noi`,
      `${base}/about`,
      `${base}/contact.html`
    ];
  } catch {
    return [website];
  }
}

function extractEmail(source: string): string | null {
  const matches = source.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  if (!matches || matches.length === 0) {
    return null;
  }

  return matches[0].toLowerCase();
}

interface EmailVars {
  businessName: string;
  city: string;
  category: string;
  unsubUrl: string;
  siteUrl: string;
}

function buildEmailContent(vars: EmailVars): { subject: string; text: string; html: string } {
  const { businessName, city, category, unsubUrl, siteUrl } = vars;

  const isBarber = /barber|frizerie/i.test(category);
  const businessType = isBarber ? "frizeria" : "salonul";
  const businessTypeCta = isBarber ? "frizerul" : "salonul";

  const subject = `Salut ${businessName}! Sistemul de programari online pentru ${businessType} ta`;

  const text = `Salut echipa ${businessName}!

Am gasit ${businessType} ta pe Google Maps si am vrut sa va prezentam OcupaLoc.ro — platforma romaneasca de programari online creata special pentru saloane si frizerii din Romania.

Cu OcupaLoc.ro poti:
• Accepta programari online 24/7 — chiar si cand esti ocupat
• Elimina telefoanele nesfarsit si mesajele pe WhatsApp
• Reduce absenta clientilor cu reminder-uri automate
• Afisa serviciile si preturile intr-un calendar elegant

Clientii tai din ${city} pot rezerva direct de pe telefon, fara cont, in mai putin de 60 de secunde.

Inscrie ${businessTypeCta} tau gratuit: ${siteUrl}

Cu drag,
Echipa OcupaLoc.ro

---
Nu mai vreti sa primiti astfel de mesaje? Va puteti dezabona here: ${unsubUrl}`;

  const html = `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; font-size: 24px; margin: 0;">OcupaLoc.ro</h1>
    <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">Programari online pentru saloane si frizerii</p>
  </div>

  <p>Salut echipa <strong>${esc(businessName)}</strong>!</p>

  <p>Am gasit ${esc(businessType)} ta pe Google Maps si am vrut sa va prezentam
  <strong>OcupaLoc.ro</strong> — platforma romaneasca de programari online creata special
  pentru saloane si frizerii din Romania.</p>

  <h2 style="font-size: 18px; color: #1e40af; border-bottom: 2px solid #dbeafe; padding-bottom: 8px;">
    Cu OcupaLoc.ro poti:
  </h2>
  <ul style="line-height: 1.8;">
    <li>✅ Accepta <strong>programari online 24/7</strong> — chiar si cand esti ocupat</li>
    <li>✅ Elimina telefoanele nesfarsit si mesajele pe WhatsApp</li>
    <li>✅ Reduce absenta clientilor cu <strong>reminder-uri automate</strong> prin SMS/email</li>
    <li>✅ Afisa serviciile si preturile intr-un calendar elegant</li>
  </ul>

  <p>Clientii tai din <strong>${esc(city)}</strong> pot rezerva direct de pe telefon,
  fara cont, in mai putin de <strong>60 de secunde</strong>.</p>

  <div style="text-align: center; margin: 32px 0;">
    <a href="${esc(siteUrl)}" style="
      background-color: #2563eb;
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 16px;
      font-weight: bold;
      display: inline-block;
    ">Inscrie ${esc(businessTypeCta)} tau gratuit &rarr;</a>
  </div>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
  <p style="font-size: 12px; color: #94a3b8; text-align: center;">
    OcupaLoc.ro &bull; Platforma de programari online &bull; Romania<br>
    <a href="${esc(unsubUrl)}" style="color: #94a3b8;">Dezaboneaza-te</a>
  </p>
</body>
</html>`;

  return { subject, text, html };
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
