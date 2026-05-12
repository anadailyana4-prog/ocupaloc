import { ImapFlow } from "imapflow";
import MailComposer from "nodemailer/lib/mail-composer";
import nodemailer from "nodemailer";

import { env } from "@/lib/config/env";

interface MailboxSendInput {
  to: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string[];
}

function getSmtpConfig() {
  return {
    host: env.get("OUTREACH_SMTP_HOST"),
    port: Number(env.get("OUTREACH_SMTP_PORT")),
    secure: env.optional("OUTREACH_SMTP_SECURE") !== "false",
    auth: {
      user: env.get("OUTREACH_SMTP_USER"),
      pass: env.get("OUTREACH_SMTP_PASSWORD")
    }
  };
}

function getImapConfig() {
  return {
    host: env.get("OUTREACH_IMAP_HOST"),
    port: Number(env.get("OUTREACH_IMAP_PORT")),
    secure: env.optional("OUTREACH_IMAP_TLS") !== "false",
    auth: {
      user: env.optional("OUTREACH_IMAP_USER") ?? env.get("OUTREACH_SMTP_USER"),
      pass: env.optional("OUTREACH_IMAP_PASSWORD") ?? env.get("OUTREACH_SMTP_PASSWORD")
    },
    sentMailbox: env.optional("OUTREACH_IMAP_SENT_MAILBOX") ?? "Sent"
  };
}

export async function sendOutreachMailboxEmail(input: MailboxSendInput): Promise<{ messageId: string | null }> {
  const from = env.get("RESEND_FROM");
  const smtp = getSmtpConfig();
  const imap = getImapConfig();

  const composer = new MailComposer({
    from,
    to: input.to.join(", "),
    bcc: input.bcc?.join(", "),
    replyTo: input.replyTo?.join(", "),
    subject: input.subject,
    text: input.text,
    html: input.html,
    date: new Date()
  });

  const raw = await composer.compile().build();
  const transporter = nodemailer.createTransport(smtp);
  const info = await transporter.sendMail({ envelope: { from: smtp.auth.user, to: [...input.to, ...(input.bcc ?? [])] }, raw });
  await transporter.close();

  const client = new ImapFlow({
    host: imap.host,
    port: imap.port,
    secure: imap.secure,
    auth: imap.auth
  });

  await client.connect();
  try {
    await client.append(imap.sentMailbox, raw, ["\\Seen"]);
  } finally {
    await client.logout();
  }

  return { messageId: info.messageId ?? null };
}