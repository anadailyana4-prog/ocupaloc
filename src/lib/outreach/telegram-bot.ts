import { env } from "@/lib/config/env";
import { sendOutreachMailboxEmail } from "@/lib/outreach/mailbox-send";
import { OUTREACH_COMMANDS } from "@/lib/outreach/ops-constants";
import { generatePersonalizedOutreach } from "@/lib/outreach/personalization-engine";
import { reportError } from "@/lib/observability";
import { buildDailyReports } from "@/lib/outreach/reporting-service";
import { runQualificationPipeline } from "@/lib/outreach/qualification-service";
import { runScraperOrchestration } from "@/lib/outreach/scraper-orchestrator";
import { runOutreachScheduler } from "@/lib/outreach/scheduler";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface TelegramChat {
  id: number;
}

interface TelegramUpdate {
  message?: {
    text?: string;
    from?: TelegramUser;
    chat?: TelegramChat;
  };
}

const TELEGRAM_MAX_MESSAGE_LENGTH = 3500;

interface SingleEmailCommandInput {
  email: string;
  businessName: string;
  city: string;
  nicheSlug: string;
  website?: string;
}

const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function getTelegramApiBase() {
  return `https://api.telegram.org/bot${env.get("TELEGRAM_BOT_TOKEN")}`;
}

async function sendTelegramRequest(method: string, payload: Record<string, unknown>) {
  const response = await fetch(`${getTelegramApiBase()}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`Telegram API returned ${response.status}`);
  }
  return response.json();
}

export async function setTelegramWebhook(webhookUrl: string, secretToken: string) {
  await sendTelegramRequest("setWebhook", {
    url: webhookUrl,
    secret_token: secretToken,
    drop_pending_updates: false,
    allowed_updates: ["message"]
  });
}

export async function setTelegramCommands() {
  await sendTelegramRequest("setMyCommands", { commands: OUTREACH_COMMANDS });
}

function splitMessage(text: string): string[] {
  if (text.length <= TELEGRAM_MAX_MESSAGE_LENGTH) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + TELEGRAM_MAX_MESSAGE_LENGTH));
    start += TELEGRAM_MAX_MESSAGE_LENGTH;
  }
  return chunks;
}

export async function sendTelegramMessage(chatId: number, text: string) {
  for (const chunk of splitMessage(text)) {
    await sendTelegramRequest("sendMessage", { chat_id: chatId, text: chunk });
  }
}

export async function notifyAdmins(text: string, options?: { excludeChatIds?: number[] }) {
  const adminClient = createSupabaseServiceClient();
  const { data, error } = await adminClient.from("telegram_admins").select("chat_id").eq("is_active", true);
  if (error) throw error;

  const excluded = new Set((options?.excludeChatIds ?? []).filter((id) => Number.isFinite(id)));

  for (const row of data ?? []) {
    const chatId = Number((row as { chat_id: number }).chat_id);
    if (!Number.isFinite(chatId) || excluded.has(chatId)) continue;
    try {
      await sendTelegramMessage(chatId, text);
    } catch {
      // Continue notifying remaining admins even if one fails.
    }
  }
}

async function isAuthorized(userId: number, chatId: number, user: TelegramUser): Promise<boolean> {
  // Fast path: check env-var allowlists first (no DB round-trip needed).
  const envIds = [
    env.optional("TELEGRAM_OWNER_IDS"),
    env.optional("TELEGRAM_ADMIN_IDS"),
    env.optional("TELEGRAM_OPERATOR_IDS")
  ]
    .flatMap((v) => (v ?? "").split(",").map((s) => s.trim()))
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);

  if (envIds.includes(userId)) {
    // Keep DB in sync without blocking; errors are intentionally swallowed.
    const adminClient = createSupabaseServiceClient();
    adminClient
      .from("telegram_admins")
      .upsert(
        {
          telegram_user_id: userId,
          chat_id: chatId,
          username: user.username ?? null,
          first_name: user.first_name ?? null,
          last_name: user.last_name ?? null,
          role: "admin",
          is_active: true,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { onConflict: "telegram_user_id" }
      )
      .then(() => undefined, () => undefined);
    return true;
  }

  // Fallback: check DB for users added manually.
  const adminClient = createSupabaseServiceClient();
  const { data } = await adminClient
    .from("telegram_admins")
    .select("id")
    .eq("telegram_user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return data !== null;
}

function parseCommand(text: string): string {
  // Handles /command, /command@botname, and extra whitespace.
  const first = text.trim().split(/\s+/)[0] ?? "";
  return first.split("@")[0]!.toLowerCase();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function parseSingleEmailCommandInput(text: string): SingleEmailCommandInput {
  const cleaned = text.replace(/^\/\w+(@\w+)?\s*/i, "").trim();

  // Simple mode: /emailsend email@domeniu.ro
  if (cleaned && !cleaned.includes("|")) {
    const email = normalizeEmail(cleaned);
    if (!SIMPLE_EMAIL_REGEX.test(email)) {
      throw new Error("Email invalid.");
    }

    return {
      email,
      businessName: "afacerea ta",
      city: "Romania",
      nicheSlug: "saloane"
    };
  }

  const parts = cleaned
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 4) {
    throw new Error("Format: /emailsend email | business | oras | niche | website(optional)");
  }

  const email = normalizeEmail(parts[0] ?? "");
  if (!SIMPLE_EMAIL_REGEX.test(email)) {
    throw new Error("Email invalid.");
  }

  const businessName = parts[1] ?? "";
  const city = parts[2] ?? "";
  const nicheSlug = (parts[3] ?? "saloane").toLowerCase().replace(/\s+/g, "-");
  const website = parts[4] ? parts[4].trim() : undefined;

  if (!businessName || !city || !nicheSlug) {
    throw new Error("Campuri lipsa: business, oras sau niche.");
  }

  return { email, businessName, city, nicheSlug, website };
}

async function isSuppressedEmail(email: string): Promise<boolean> {
  const adminClient = createSupabaseServiceClient();
  const { data, error } = await adminClient
    .from("suppression_list")
    .select("id")
    .eq("channel", "email")
    .eq("normalized_value", normalizeEmail(email))
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data !== null;
}

function buildSingleEmailPreview(input: SingleEmailCommandInput) {
  const personalized = generatePersonalizedOutreach({
    nicheSlug: input.nicheSlug,
    businessName: input.businessName,
    city: input.city,
    website: input.website,
    observableSignals: {
      bookingLinkDetected: false,
      instagramDetected: Boolean(input.website?.includes("instagram.com")),
      hasServiceMenu: false,
      reviewsMentionQueue: false
    },
    optOutUrl: "https://ocupaloc.ro/contact",
    senderName: "Echipa ocupaloc.ro"
  });

  return personalized;
}

async function handleEmailPreviewCommand(text: string) {
  const input = parseSingleEmailCommandInput(text);
  const suppressed = await isSuppressedEmail(input.email);
  if (suppressed) {
    throw new Error("Email blocat (suppression_list). Nu trimit.");
  }

  const personalized = buildSingleEmailPreview(input);
  return [
    "Preview email personalizat:",
    `To: ${input.email}`,
    `Business: ${input.businessName}`,
    `City: ${input.city}`,
    `Niche: ${input.nicheSlug}`,
    "",
    `Subject: ${personalized.subject}`,
    "",
    personalized.text,
    "",
    "Pentru trimitere: /emailsend email@domeniu.ro",
    "Optional (manual): /emailsend email | business | oras | niche | website(optional)"
  ].join("\n");
}

async function handleEmailSendCommand(text: string) {
  const input = parseSingleEmailCommandInput(text);
  const suppressed = await isSuppressedEmail(input.email);
  if (suppressed) {
    throw new Error("Email blocat (suppression_list). Nu trimit.");
  }

  const personalized = buildSingleEmailPreview(input);
  const sent = await sendOutreachMailboxEmail({
    to: [input.email],
    subject: personalized.subject,
    text: personalized.text,
    html: personalized.html,
    replyTo: ["contact@ocupaloc.ro"]
  });

  return [
    "Email trimis.",
    `To: ${input.email}`,
    `Subject: ${personalized.subject}`,
    `Message-ID: ${sent.messageId ?? "n/a"}`
  ].join("\n");
}

/** @deprecated Kept for backward compatibility with existing tests. */
export function buildHelpMessage() {
  return "Comenzi disponibile: /scrape /send /report /emailpreview /emailsend. Sau trimite direct email@domeniu.ro pentru trimitere automata.";
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;
  const text = message?.text?.trim();
  const from = message?.from;
  const chat = message?.chat;

  if (!text || !from || !chat) {
    return { ok: true, ignored: true };
  }

  const directEmail = normalizeEmail(text);
  const isCommand = text.startsWith("/");
  const isDirectEmailMessage = SIMPLE_EMAIL_REGEX.test(directEmail);

  if (!isCommand && !isDirectEmailMessage) {
    return { ok: true, ignored: true };
  }

  let authorized = false;
  try {
    authorized = await isAuthorized(from.id, chat.id, from);
  } catch {
    // DB unavailable — deny by default to be safe.
  }

  if (!authorized) {
    try {
      await sendTelegramMessage(chat.id, "Acces neautorizat.");
    } catch {
      // Ignore.
    }
    return { ok: true, unauthorized: true };
  }

  const command = isCommand ? parseCommand(text) : "/emailsend";
  const effectiveText = isDirectEmailMessage ? `/emailsend ${directEmail}` : text;
  let responseText: string;

  try {
    switch (command) {
      case "/scrape": {
        try {
          await sendTelegramMessage(chat.id, "Pornesc scrape + calificare. Poate dura 1-5 minute, revin cu raport.");
        } catch {
          // Continue even if the acknowledgement cannot be delivered.
        }

        const scrapeResult = await runScraperOrchestration({ notifyAlerts: false });
        const qualResult = await runQualificationPipeline({ zoneId: scrapeResult.zoneId });
        responseText = [
          "Scrape + calificare finalizat.",
          `Localitati procesate: ${scrapeResult.localitiesProcessed}`,
          `Lead-uri descoperite: ${scrapeResult.discovered}`,
          `Lead-uri inserate: ${scrapeResult.inserted}`,
          scrapeResult.lowYield ? "Atentie: yield mic pe rularea curenta." : null,
          "",
          `Qualified: ${qualResult.qualified}`,
          `Review: ${qualResult.review}`,
          `Rejected: ${qualResult.rejected}`,
          `Suppressed: ${qualResult.suppressed}`
        ]
          .filter(Boolean)
          .join("\n");
        break;
      }

      case "/send": {
        const result = await runOutreachScheduler({ forceStart: true, maxBatchSizeOverride: 10 });
        responseText = result.ok
          ? [
              "Trimitere executata.",
              result.sent !== undefined ? `Trimise: ${result.sent}` : null,
              result.failed !== undefined ? `Esuate: ${result.failed}` : null,
              result.reason ? `Detalii: ${result.reason}` : null
            ]
              .filter(Boolean)
              .join("\n")
          : `Trimiterea nu a putut fi pornita. ${result.reason ?? ""}`.trim();
        break;
      }

      case "/report": {
        const reports = await buildDailyReports();
        responseText = [
          "Raport zilnic:",
          "",
          reports.operational,
          "",
          reports.coverage,
          "",
          reports.efficiency
        ].join("\n");
        break;
      }

      case "/emailpreview": {
        responseText = await handleEmailPreviewCommand(effectiveText);
        break;
      }

      case "/emailsend": {
        responseText = await handleEmailSendCommand(effectiveText);
        break;
      }

      default: {
        responseText =
          "Comenzi disponibile: /scrape /send /report /emailpreview /emailsend. Sau trimite direct email@domeniu.ro pentru trimitere automata.";
        break;
      }
    }
  } catch (err) {
    responseText = `Eroare la ${command}: ${err instanceof Error ? err.message : "eroare necunoscuta"}`;
  }

  try {
    await sendTelegramMessage(chat.id, responseText);
  } catch (error) {
    // Keep webhook stable even if Telegram rejects the response.
    reportError("cron", "telegram_outreach_send_failed", error, {
      command,
      chatId: chat.id,
      userId: from.id
    });
  }

  return { ok: true };
}
