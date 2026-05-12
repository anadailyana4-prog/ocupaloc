import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { ParsedMail } from "mailparser";

import { env } from "@/lib/config/env";
import { normalizeEmailCandidate } from "@/lib/outreach/email-filter";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

const POSITIVE_REPLY_KEYWORDS = [
  "interesat", "interesata", "da, ", "da.", "da!", "vreau", "cum functioneaza",
  "spune-mi", "spune mi", "detalii", "cand", "când", "cum putem", "sa discutam",
  "să discutăm", "hai sa", "hai să", "te sun", "suna-ma", "sunati", "sunați",
  "ma intereseaza", "mă interesează", "mai multe informatii", "mai multe informații"
];

function isPositiveReply(text: string | null | undefined): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return POSITIVE_REPLY_KEYWORDS.some((kw) => lower.includes(kw));
}

async function notifyTelegramPositiveReply(input: {
  businessName: string | null;
  fromEmail: string;
  leadId: string | null;
  snippet: string;
}): Promise<void> {
  const token = env.optional("TELEGRAM_BOT_TOKEN");
  if (!token) return;

  const admin = createSupabaseServiceClient();
  const adminsResult = await admin
    .from("telegram_admins")
    .select("chat_id")
    .eq("is_active", true)
    .limit(5);
  if (adminsResult.error || !adminsResult.data?.length) return;

  const name = input.businessName ?? input.fromEmail;
  const snippet = input.snippet.slice(0, 200).replace(/\n+/g, " ").trim();
  const message =
    `🔔 *Reply pozitiv primit!*\n\n` +
    `🏢 *${name}*\n` +
    `📧 ${input.fromEmail}\n\n` +
    `💬 _"${snippet}"_\n\n` +
    `👉 Raspunde acum cat e cald!`;

  await Promise.allSettled(
    adminsResult.data.map((row) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: (row as { chat_id: number }).chat_id,
          text: message,
          parse_mode: "Markdown"
        })
      })
    )
  );
}

export interface ReplySyncResult {
  imported: number;
  linked: number;
  autoReplies: number;
  skipped: number;
}

function isAutoReply(subject: string | null | undefined, headers: Map<string, unknown>): boolean {
  const autoSubmitted = String(headers.get("auto-submitted") ?? "").toLowerCase();
  const precedence = String(headers.get("precedence") ?? "").toLowerCase();
  const xAutoReply = String(headers.get("x-autoreply") ?? headers.get("x-autorespond") ?? "").toLowerCase();
  const normalizedSubject = (subject ?? "").toLowerCase();

  return (
    (autoSubmitted.length > 0 && autoSubmitted !== "no") ||
    ["bulk", "junk", "list"].includes(precedence) ||
    xAutoReply.length > 0 ||
    normalizedSubject.includes("out of office") ||
    normalizedSubject.includes("automatic reply") ||
    normalizedSubject.includes("autoreply")
  );
}

export async function syncOutreachReplies(maxMessages = 100): Promise<ReplySyncResult> {
  const host = env.get("OUTREACH_IMAP_HOST");
  const port = Number(env.get("OUTREACH_IMAP_PORT"));
  const user = env.get("OUTREACH_IMAP_USER");
  const password = env.get("OUTREACH_IMAP_PASSWORD");
  const tls = env.optional("OUTREACH_IMAP_TLS") !== "false";

  const admin = createSupabaseServiceClient();
  const client = new ImapFlow({
    host,
    port,
    secure: tls,
    auth: { user, pass: password }
  });

  const result: ReplySyncResult = { imported: 0, linked: 0, autoReplies: 0, skipped: 0 };

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");

  try {
    const since = new Date();
    since.setDate(since.getDate() - 14);

    const uids = (await client.search({ since })) || [];
    const recentUids = uids.slice(-maxMessages);

    for await (const message of client.fetch(recentUids, { uid: true, source: true, envelope: true, internalDate: true })) {
      if (!message.source) {
        result.skipped += 1;
        continue;
      }

      const existing = await admin
        .from("outreach_replies")
        .select("id")
        .eq("mailbox_uid", message.uid)
        .maybeSingle();

      if (existing.data) {
        result.skipped += 1;
        continue;
      }

      const parsed = (await simpleParser(message.source, {})) as ParsedMail;
      const fromEmail = normalizeEmailCandidate(parsed.from?.value?.[0]?.address ?? null);
      if (!fromEmail || fromEmail === user.toLowerCase()) {
        result.skipped += 1;
        continue;
      }

      const leadLookup = await admin
        .from("outreach_leads")
        .select("id")
        .eq("email", fromEmail)
        .maybeSingle();

      const headers = new Map<string, unknown>();
      for (const [key, value] of parsed.headers) {
        headers.set(String(key).toLowerCase(), value);
      }

      const autoReply = isAutoReply(parsed.subject, headers);
      const receivedAt = message.internalDate instanceof Date ? message.internalDate : new Date();

      const insertResult = await admin.from("outreach_replies").insert({
        lead_id: leadLookup.data?.id ?? null,
        mailbox_uid: message.uid,
        message_id: parsed.messageId ?? null,
        from_email: fromEmail,
        subject: parsed.subject ?? null,
        text_body: parsed.text ?? null,
        html_body: typeof parsed.html === "string" ? parsed.html : null,
        in_reply_to: parsed.inReplyTo ?? null,
        received_at: receivedAt.toISOString(),
        is_auto_reply: autoReply
      });

      if (insertResult.error) {
        throw insertResult.error;
      }

      result.imported += 1;
      if (autoReply) {
        result.autoReplies += 1;
      }

      if (leadLookup.data?.id) {
        await admin.from("outreach_leads").update({ status: "replied" }).eq("id", leadLookup.data.id);
        result.linked += 1;
      }

      // Fire-and-forget Telegram alert for positive (non-auto) replies
      if (!autoReply && isPositiveReply(parsed.text)) {
        const leadNameResult = leadLookup.data?.id
          ? await admin.from("outreach_leads").select("business_name").eq("id", leadLookup.data.id).maybeSingle()
          : null;
        notifyTelegramPositiveReply({
          businessName: (leadNameResult?.data as { business_name: string } | null)?.business_name ?? null,
          fromEmail,
          leadId: leadLookup.data?.id ?? null,
          snippet: parsed.text ?? ""
        }).catch(() => undefined); // fire-and-forget, never block import
      }
    }
  } finally {
    lock.release();
    await client.logout();
  }

  return result;
}