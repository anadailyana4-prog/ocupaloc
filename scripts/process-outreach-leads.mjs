import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { ImapFlow } from "imapflow";
import MailComposer from "nodemailer/lib/mail-composer/index.js";
import nodemailer from "nodemailer";

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const BLOCKED_EXACT_ADDRESSES = new Set(["#", "asistenta@mero.ro", "contact@exemplu.ro", "info@yourgmail.com"]);
const BLOCKED_DOMAINS = ["sentry.io", "yourgmail.com"];
const BLOCKED_DOMAIN_SUFFIXES = [".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif", ".ico", ".avif"];
const BLOCKED_LOCAL_PARTS = ["noreply", "no-reply", "donotreply", "do-not-reply", "mailer-daemon"];

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const signingSecret = process.env.OUTREACH_SIGNING_SECRET;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ocupaloc.ro";
const SMTP_HOST = process.env.OUTREACH_SMTP_HOST;
const SMTP_PORT = Number(process.env.OUTREACH_SMTP_PORT || "465");
const SMTP_USER = process.env.OUTREACH_SMTP_USER;
const SMTP_PASSWORD = process.env.OUTREACH_SMTP_PASSWORD;
const SMTP_SECURE = process.env.OUTREACH_SMTP_SECURE !== "false";
const IMAP_HOST = process.env.OUTREACH_IMAP_HOST;
const IMAP_PORT = Number(process.env.OUTREACH_IMAP_PORT || "993");
const IMAP_USER = process.env.OUTREACH_IMAP_USER || SMTP_USER;
const IMAP_PASSWORD = process.env.OUTREACH_IMAP_PASSWORD || SMTP_PASSWORD;
const IMAP_TLS = process.env.OUTREACH_IMAP_TLS !== "false";
const IMAP_SENT_MAILBOX = process.env.OUTREACH_IMAP_SENT_MAILBOX || "Sent";

if (!signingSecret || !SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !IMAP_HOST || !IMAP_USER || !IMAP_PASSWORD) {
  console.error("Missing outreach mailbox envs");
  process.exit(1);
}

function token(id) {
  const mac = crypto.createHmac("sha256", signingSecret).update(id).digest("hex");
  return Buffer.from(`${id}:${mac}`).toString("base64url");
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

function normalizeEmailCandidate(value) {
  if (!value) return null;
  const trimmed = String(value).trim().toLowerCase();
  if (!trimmed || BLOCKED_EXACT_ADDRESSES.has(trimmed)) return null;

  const withoutMailto = trimmed.startsWith("mailto:") ? trimmed.slice(7) : trimmed;
  const sanitized = withoutMailto.replace(/[)>.,;]+$/g, "").trim();
  if (!EMAIL_PATTERN.test(sanitized)) return null;

  const [localPart, domain] = sanitized.split("@");
  if (!localPart || !domain) return null;
  if (BLOCKED_LOCAL_PARTS.includes(localPart)) return null;
  if (BLOCKED_DOMAINS.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`))) return null;
  if (BLOCKED_DOMAIN_SUFFIXES.some((suffix) => domain.endsWith(suffix))) return null;

  return sanitized;
}

function extractFirstValidEmail(source) {
  const mailtoMatches = source.match(/mailto:([^\"'\s>]+)/gi) ?? [];
  for (const match of mailtoMatches) {
    const normalized = normalizeEmailCandidate(match);
    if (normalized) return normalized;
  }

  const matches = source.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  for (const match of matches) {
    const normalized = normalizeEmailCandidate(match);
    if (normalized) return normalized;
  }

  return null;
}

function content(lead) {
  const businessName = lead.business_name;
  const city = lead.city || "Bucuresti";
  const category = lead.category || "frizerie";
  const isBarber = /barber|frizerie/i.test(category);
  const businessType = isBarber ? "frizeria" : "salonul";
  const businessTypeCta = isBarber ? "frizerul" : "salonul";
  const unsub = `${siteUrl}/api/leads/unsubscribe?token=${token(lead.id)}`;
  const subject = `Salut ${businessName}! Sistemul de programari online pentru ${businessType} ta`;
  const text = `Salut echipa ${businessName}!\n\nAm gasit ${businessType} ta pe Google Maps si vrem sa va prezentam OcupaLoc.ro, platforma romaneasca de programari online pentru saloane si frizerii.\n\nCu OcupaLoc.ro poti:\n• Accepta programari online 24/7\n• Reduce apelurile si mesajele repetitive\n• Trimite remindere automate\n• Afisa serviciile intr-un calendar clar\n\nClientii din ${city} pot rezerva usor direct de pe telefon.\n\nInscrie ${businessTypeCta} tau gratuit: ${siteUrl}\n\nCu respect,\nEchipa OcupaLoc.ro\n\nDezabonare: ${unsub}`;
  const html = `<p>Salut echipa <strong>${esc(businessName)}</strong>!</p><p>Am gasit ${esc(businessType)} ta pe Google Maps si vrem sa va prezentam <strong>OcupaLoc.ro</strong>, platforma romaneasca de programari online pentru saloane si frizerii.</p><ul><li>Accepta programari online 24/7</li><li>Reduce apelurile si mesajele repetitive</li><li>Trimite remindere automate</li><li>Afiseaza serviciile intr-un calendar clar</li></ul><p>Clientii din <strong>${esc(city)}</strong> pot rezerva direct de pe telefon.</p><p><a href="${esc(siteUrl)}">Inscrie ${esc(businessTypeCta)} tau gratuit</a></p><p>Cu respect,<br/>Echipa OcupaLoc.ro</p><p style="font-size:12px"><a href="${esc(unsub)}">Dezabonare</a></p>`;
  return { subject, text, html };
}

function candidates(website) {
  try {
    const u = new URL(website.startsWith("http") ? website : `https://${website}`);
    const base = `${u.protocol}//${u.host}`;
    return [u.toString(), `${base}/contact`, `${base}/contact-us`, `${base}/despre`, `${base}/despre-noi`, `${base}/about`, `${base}/contact.html`];
  } catch {
    return [website];
  }
}

function extract(html) {
  return extractFirstValidEmail(html);
}

async function fetchEmail(website) {
  for (const u of candidates(website)) {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 4000);
      const r = await fetch(u, {
        signal: c.signal,
        headers: { "user-agent": "Mozilla/5.0 (compatible; OcupaLocBot/1.0; +https://ocupaloc.ro)" }
      });
      clearTimeout(t);
      if (!r.ok) continue;
      const tx = await r.text();
      const em = extract(tx);
      if (em) return em;
    } catch {
      // continue
    }
  }
  return null;
}

async function sendMailboxEmail({ to, bcc, subject, text, html }) {
  const composer = new MailComposer({
    from: process.env.RESEND_FROM,
    to: to.join(", "),
    bcc: bcc?.join(", "),
    subject,
    text,
    html,
    date: new Date()
  });

  const raw = await composer.compile().build();

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
  });

  const info = await transporter.sendMail({
    envelope: { from: SMTP_USER, to: [...to, ...(bcc || [])] },
    raw
  });
  await transporter.close();

  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: IMAP_TLS,
    auth: { user: IMAP_USER, pass: IMAP_PASSWORD }
  });

  await client.connect();
  try {
    await client.append(IMAP_SENT_MAILBOX, raw, ["\\Seen"]);
  } finally {
    await client.logout();
  }

  return info.messageId ?? null;
}

const { data: pending, error } = await supabase
  .from("outreach_leads")
  .select("id,business_name,email,website,city,category")
  .eq("status", "pending")
  .order("created_at", { ascending: true })
  .limit(400);

if (error) throw error;

const enriched = [];
const sent = [];
const failed = [];
const noEmail = [];

const realLeads = (pending || []).filter((lead) => !/^TEST\b/i.test(lead.business_name || ""));

async function processLead(lead) {
  let email = normalizeEmailCandidate(lead.email);
  if (!email && lead.website) {
    email = await fetchEmail(lead.website);
    if (email) {
      enriched.push({ id: lead.id, business_name: lead.business_name, email });
      await supabase.from("outreach_leads").update({ email }).eq("id", lead.id);
    }
  }

  if (!email) {
    noEmail.push({ id: lead.id, business_name: lead.business_name });
    await supabase.from("outreach_leads").update({ status: "no_email" }).eq("id", lead.id);
    return;
  }

  const mail = content(lead);
  try {
    const messageId = await sendMailboxEmail({
      to: [email],
      bcc: ["contact@ocupaloc.ro"],
      subject: mail.subject,
      text: mail.text,
      html: mail.html
    });

    sent.push({ id: lead.id, business_name: lead.business_name, email, resend_id: messageId });
    await supabase.from("outreach_leads").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", lead.id);
  } catch (error) {
    failed.push({ id: lead.id, business_name: lead.business_name, email, error: String(error) });
    await supabase.from("outreach_leads").update({ status: "failed" }).eq("id", lead.id);
    return;
  }
}

const CONCURRENCY = 8;
for (let i = 0; i < realLeads.length; i += CONCURRENCY) {
  const chunk = realLeads.slice(i, i + CONCURRENCY);
  await Promise.all(chunk.map((lead) => processLead(lead)));
}

const { data: statuses } = await supabase.from("outreach_leads").select("status");
const counts = {};
for (const r of statuses || []) counts[r.status] = (counts[r.status] || 0) + 1;

console.log(
  JSON.stringify(
    {
      processed: realLeads.length,
      enrichedCount: enriched.length,
      sentCount: sent.length,
      failedCount: failed.length,
      noEmailCount: noEmail.length,
      enriched,
      sent,
      failed,
      counts
    },
    null,
    2
  )
);
