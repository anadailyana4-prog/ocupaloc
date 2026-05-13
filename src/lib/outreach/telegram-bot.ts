import { env } from "@/lib/config/env";
import { OUTREACH_COMMANDS } from "@/lib/outreach/ops-constants";
import { evaluateZoneExhaustion } from "@/lib/outreach/exhaustion";
import {
  approveNextOperationalUnit,
  evaluateAndUpdateZoneExhaustion,
  getCoverageSnapshot,
  getOperationalSnapshot,
  pauseActiveOutreach,
  recordOperatorAction,
  resumeActiveOutreach
} from "@/lib/outreach/coverage-service";
import { buildDailyReports } from "@/lib/outreach/reporting-service";
import { listRecentReplyEvents } from "@/lib/outreach/reply-events";
import { getDeliverabilityReport } from "@/lib/outreach/deliverability-service";
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

let validatedRoleConfig = false;

const TELEGRAM_MAX_MESSAGE_LENGTH = 3500;

function getTelegramApiBase() {
  return `https://api.telegram.org/bot${env.get("TELEGRAM_BOT_TOKEN")}`;
}

function parseIds(value?: string) {
  const invalid: string[] = [];
  const values = new Set<number>();
  for (const item of (value ?? "").split(",").map((part) => part.trim()).filter(Boolean)) {
    if (!/^\d+$/.test(item)) {
      invalid.push(item);
      continue;
    }
    const parsed = Number(item);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      invalid.push(item);
      continue;
    }
    values.add(parsed);
  }
  return { values, invalid };
}

function validateTelegramRoleConfig() {
  if (validatedRoleConfig) return;

  const owner = parseIds(env.optional("TELEGRAM_OWNER_IDS"));
  const admin = parseIds(env.optional("TELEGRAM_ADMIN_IDS"));
  const operator = parseIds(env.optional("TELEGRAM_OPERATOR_IDS"));

  const invalid = [...owner.invalid, ...admin.invalid, ...operator.invalid];
  if (invalid.length > 0) {
    console.warn(`TELEGRAM_*_IDS contine valori invalide: ${invalid.join(", ")}`);
  }

  const overlapOwnerAdmin = [...owner.values].filter((id) => admin.values.has(id));
  const overlapOwnerOperator = [...owner.values].filter((id) => operator.values.has(id));
  const overlapAdminOperator = [...admin.values].filter((id) => operator.values.has(id));

  if (overlapOwnerAdmin.length || overlapOwnerOperator.length || overlapAdminOperator.length) {
    console.warn("TELEGRAM_OWNER_IDS, TELEGRAM_ADMIN_IDS si TELEGRAM_OPERATOR_IDS contin ID-uri suprapuse.");
  }

  validatedRoleConfig = true;
}

function getRoleSets() {
  return {
    owner: parseIds(env.optional("TELEGRAM_OWNER_IDS")).values,
    admin: parseIds(env.optional("TELEGRAM_ADMIN_IDS")).values,
    operator: parseIds(env.optional("TELEGRAM_OPERATOR_IDS")).values
  };
}

function getRoleFromEnv(userId: number) {
  const roles = getRoleSets();
  if (roles.owner.has(userId)) return "owner" as const;
  if (roles.admin.has(userId)) return "admin" as const;
  if (roles.operator.has(userId)) return "operator" as const;
  return null;
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

export async function setTelegramCommands() {
  await sendTelegramRequest("setMyCommands", { commands: OUTREACH_COMMANDS });
}

export async function setTelegramWebhook(webhookUrl: string, secretToken: string) {
  await sendTelegramRequest("setWebhook", {
    url: webhookUrl,
    secret_token: secretToken,
    drop_pending_updates: false,
    allowed_updates: ["message"]
  });
}

export function buildHelpMessage() {
  return [
    "Comenzi disponibile (mod simplificat):",
    OUTREACH_COMMANDS.map((item) => `/${item.command} - ${item.description}`).join("\n"),
    "",
    "Flux recomandat:",
    "/scrape - porneste scraping + calificare pe zona activa",
    "/queue - vezi cate lead-uri qualified sunt gata",
    "/send - trimite batch controlat (10/ora)",
    "/approve-next - confirma trecerea la urmatoarea zona sau nisa"
  ].join("\n");
}

function splitTelegramMessage(text: string) {
  if (text.length <= TELEGRAM_MAX_MESSAGE_LENGTH) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + TELEGRAM_MAX_MESSAGE_LENGTH, text.length);
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

export async function sendTelegramMessage(chatId: number, text: string) {
  const chunks = splitTelegramMessage(text);
  for (const chunk of chunks) {
    await sendTelegramRequest("sendMessage", { chat_id: chatId, text: chunk });
  }
}

async function upsertTelegramAdmin(user: TelegramUser, chatId: number) {
  const admin = createSupabaseServiceClient();
  const role = getRoleFromEnv(user.id);
  if (!role) {
    const existing = await admin
      .from("telegram_admins")
      .select("id, role, is_active")
      .eq("telegram_user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data) {
      throw new Error("Accesul la bot nu este permis pentru acest utilizator.");
    }
    return { id: (existing.data as { id: string }).id, role: (existing.data as { role: "owner" | "admin" | "operator" }).role };
  }

  const result = await admin
    .from("telegram_admins")
    .upsert(
      {
        telegram_user_id: user.id,
        chat_id: chatId,
        username: user.username ?? null,
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
        role,
        is_active: true,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { onConflict: "telegram_user_id" }
    )
    .select("id, role")
    .single();

  if (result.error) {
    throw result.error;
  }

  return result.data as { id: string; role: "owner" | "admin" | "operator" };
}

function parseCommandInput(text: string) {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const raw = (tokens[0] ?? "").toLowerCase();
  // Telegram can send commands as /command@botname in groups.
  const withoutBotMention = raw.split("@")[0] ?? raw;
  const command = withoutBotMention.replace(/_/g, "-");
  const args = tokens.slice(1);
  return { command, args };
}

function formatStatusText(snapshot: Awaited<ReturnType<typeof getOperationalSnapshot>> | null) {
  if (!snapshot) {
    return "Nu exista inca o nisa si o zona activa configurata.";
  }

  const exhaustion = evaluateZoneExhaustion({
    scrapingCompleted: snapshot.zone.scraping_completed,
    scrapeRunsCount: 3,
    latestNewValidLeads: snapshot.zone.last_scrape_new_valid_leads,
    previousNewValidLeads: 0,
    rerunHistory: [],
    remainingContactableLeads: snapshot.zone.remaining_leads_count,
    uncontactableLeads: snapshot.zone.uncontactable_leads_count,
    duplicateLeads: snapshot.zone.duplicate_leads_count,
    alreadyContactedLeads: snapshot.zone.contacted_leads_count,
    suppressedLeads: 0,
    lowYieldRunsCount: snapshot.zone.last_scrape_new_valid_leads <= 3 ? 1 : 0,
    usefulYieldRate: snapshot.zone.discovered_leads_count > 0 ? snapshot.zone.last_scrape_new_valid_leads / snapshot.zone.discovered_leads_count : 0,
    confirmationRunsWithoutUsefulVolume: snapshot.zone.last_scrape_new_valid_leads <= 1 ? 1 : 0
  });

  return [
    `Nisa curenta: ${snapshot.niche.slug}`,
    `Zona curenta: ${snapshot.zone.display_name}`,
    `Status: ${snapshot.zone.status}`,
    `Lead-uri descoperite: ${snapshot.zone.discovered_leads_count}`,
    `Lead-uri valide: ${snapshot.zone.qualified_leads_count}`,
    `Contactate: ${snapshot.zone.contacted_leads_count}`,
    `Ramase: ${snapshot.zone.remaining_leads_count}`,
    `Reply-uri: ${snapshot.zone.replies_count}`,
    `Bounce-uri: ${snapshot.zone.bounce_count}`,
    `Lead-uri noi la ultima rulare: ${snapshot.zone.last_scrape_new_valid_leads}`,
    `Probabilitate epuizare zona: ${exhaustion.probableExhaustion}`,
    `Urmatoarea zona: ${snapshot.nextZone?.display_name ?? "Asteapta confirmare pentru nisa urmatoare"}`
  ].join("\n");
}

function formatCoverageText(coverage: Awaited<ReturnType<typeof getCoverageSnapshot>>) {
  return [
    `Nisa activa: ${coverage.niche.slug}`,
    `Zone terminate: ${coverage.completed} din ${coverage.zones.length}`,
    `Zona in lucru: ${coverage.activeZone?.display_name ?? "Nicio zona activa"}`,
    `Urmatoarea zona: ${coverage.nextZone?.display_name ?? "Nu exista alta zona in nisa curenta"}`,
    `Progres national pe nisa: ${coverage.progressPercent}%`
  ].join("\n");
}

async function formatDeliveryStatusText() {
  const snapshot = await getOperationalSnapshot();
  if (!snapshot) {
    return "Nu exista inca o nisa si o zona activa configurata.";
  }

  const admin = createSupabaseServiceClient();
  const campaignResult = await admin
    .from("outreach_campaigns")
    .select("id, status")
    .eq("coverage_zone_id", snapshot.zone.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (campaignResult.error) {
    throw campaignResult.error;
  }

  if (!campaignResult.data) {
    return "Nu exista inca o campanie de outreach pentru zona activa.";
  }

  const messagesResult = await admin
    .from("outreach_messages")
    .select("status")
    .eq("campaign_id", (campaignResult.data as { id: string }).id)
    .limit(5000);

  if (messagesResult.error) {
    throw messagesResult.error;
  }

  const counts = {
    queued: 0,
    sent: 0,
    opened: 0,
    replied: 0,
    failed: 0,
    bounced: 0
  };

  for (const row of messagesResult.data ?? []) {
    const status = (row as { status: string }).status;
    if (status in counts) {
      counts[status as keyof typeof counts] += 1;
    }
  }

  const delivered = counts.sent + counts.opened + counts.replied;
  const notDelivered = counts.failed + counts.bounced;
  const total = delivered + notDelivered + counts.queued;
  const deliveryRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : "0.0";

  return [
    "📦 STATUS LIVRARE",
    `Nisa: ${snapshot.niche.slug}`,
    `Zona: ${snapshot.zone.display_name}`,
    `Campanie status: ${(campaignResult.data as { status: string }).status}`,
    "",
    `Total mesaje: ${total}`,
    `Livrate/acceptate: ${delivered}`,
    `Nelivrate: ${notDelivered}`,
    `In coada: ${counts.queued}`,
    `Open: ${counts.opened}`,
    `Reply: ${counts.replied}`,
    `Delivery rate: ${deliveryRate}%`
  ].join("\n");
}

async function formatHealthText() {
  const [snapshot, deliverability, webhookResponse] = await Promise.all([
    getOperationalSnapshot(),
    getDeliverabilityReport(),
    fetch(`${getTelegramApiBase()}/getWebhookInfo`).then((response) => response.json() as Promise<{ ok: boolean; result?: { pending_update_count?: number; last_error_message?: string | null } }>)
  ]);

  const webhook = webhookResponse.result ?? {};
  const pendingUpdates = webhook.pending_update_count ?? 0;
  const lastWebhookError = webhook.last_error_message ?? null;

  const lines = [
    "🩺 HEALTH CHECK",
    snapshot ? `Zona: ${snapshot.zone.display_name} (${snapshot.zone.status})` : "Zona: nu exista inca una activa",
    `Pending updates: ${pendingUpdates}`,
    `Webhook last error: ${lastWebhookError ?? "none"}`,
    "",
    deliverability.formattedText
  ];

  if (pendingUpdates > 0 || lastWebhookError) {
    lines.push("", "⚠️ Recomandare: verifica webhook-ul si mesajele recente din Telegram.");
  }

  return lines.join("\n");
}

async function formatStatsText() {
  const snapshot = await getOperationalSnapshot();
  if (!snapshot) {
    return "Nu exista inca o nisa si o zona activa configurata.";
  }

  const admin = createSupabaseServiceClient();
  const campaignResult = await admin
    .from("outreach_campaigns")
    .select("id")
    .eq("coverage_zone_id", snapshot.zone.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (campaignResult.error) throw campaignResult.error;
  if (!campaignResult.data) return "Nu exista inca o campanie de outreach pentru zona activa.";

  const now = Date.now();
  const startTodayIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const sevenDaysIso = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [todayMessages, sevenDayMessages] = await Promise.all([
    admin
      .from("outreach_messages")
      .select("status")
      .eq("campaign_id", (campaignResult.data as { id: string }).id)
      .gte("created_at", startTodayIso)
      .limit(5000),
    admin
      .from("outreach_messages")
      .select("status")
      .eq("campaign_id", (campaignResult.data as { id: string }).id)
      .gte("created_at", sevenDaysIso)
      .limit(10000)
  ]);

  if (todayMessages.error) throw todayMessages.error;
  if (sevenDayMessages.error) throw sevenDayMessages.error;

  const summarize = (rows: Array<{ status: string }> | null | undefined) => {
    const stats = { sent: 0, bounced: 0, failed: 0, replied: 0 };
    for (const row of rows ?? []) {
      if (row.status === "sent") stats.sent += 1;
      if (row.status === "bounced") stats.bounced += 1;
      if (row.status === "failed") stats.failed += 1;
      if (row.status === "replied") stats.replied += 1;
    }
    const delivered = stats.sent + stats.replied;
    const undelivered = stats.bounced + stats.failed;
    const total = delivered + undelivered;
    const deliveryRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : "0.0";
    const replyRate = delivered > 0 ? ((stats.replied / delivered) * 100).toFixed(1) : "0.0";
    return { ...stats, delivered, undelivered, total, deliveryRate, replyRate };
  };

  const today = summarize(todayMessages.data as Array<{ status: string }> | null);
  const last7 = summarize(sevenDayMessages.data as Array<{ status: string }> | null);

  return [
    "📊 OUTREACH STATS",
    `Nisa: ${snapshot.niche.slug}`,
    `Zona: ${snapshot.zone.display_name}`,
    "",
    "Azi:",
    `Trimise: ${today.sent}`,
    `Livrate: ${today.delivered}`,
    `Nelivrate: ${today.undelivered}`,
    `Reply: ${today.replied}`,
    `Delivery rate: ${today.deliveryRate}%`,
    `Reply rate: ${today.replyRate}%`,
    "",
    "Ultimele 7 zile:",
    `Trimise: ${last7.sent}`,
    `Livrate: ${last7.delivered}`,
    `Nelivrate: ${last7.undelivered}`,
    `Reply: ${last7.replied}`,
    `Delivery rate: ${last7.deliveryRate}%`,
    `Reply rate: ${last7.replyRate}%`
  ].join("\n");
}

async function formatQueueText() {
  const snapshot = await getOperationalSnapshot();
  if (!snapshot) {
    return "Nu exista inca o nisa si o zona activa configurata.";
  }

  const admin = createSupabaseServiceClient();
  const zoneId = snapshot.zone.id;

  const [leadRows, campaignResult] = await Promise.all([
    admin
      .from("leads")
      .select("qualification_status")
      .eq("coverage_zone_id", zoneId)
      .in("qualification_status", ["qualified", "review", "suppressed", "contacted"])
      .limit(10000),
    admin
      .from("outreach_campaigns")
      .select("id")
      .eq("coverage_zone_id", zoneId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  if (leadRows.error) throw leadRows.error;
  if (campaignResult.error) throw campaignResult.error;

  const leadCounts = { qualified: 0, review: 0, suppressed: 0, contacted: 0 };
  for (const row of leadRows.data ?? []) {
    const status = (row as { qualification_status: string }).qualification_status;
    if (status in leadCounts) {
      leadCounts[status as keyof typeof leadCounts] += 1;
    }
  }

  let dueToday = 0;
  if (campaignResult.data) {
    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);
    const followups = await admin
      .from("outreach_followups")
      .select("id")
      .eq("campaign_id", (campaignResult.data as { id: string }).id)
      .eq("status", "scheduled")
      .lte("due_at", endToday.toISOString())
      .limit(10000);
    if (followups.error) throw followups.error;
    dueToday = followups.data?.length ?? 0;
  }

  return [
    "🧰 OUTREACH QUEUE",
    `Nisa: ${snapshot.niche.slug}`,
    `Zona: ${snapshot.zone.display_name}`,
    "",
    `Qualified: ${leadCounts.qualified}`,
    `Review: ${leadCounts.review}`,
    `Suppressed: ${leadCounts.suppressed}`,
    `Contacted: ${leadCounts.contacted}`,
    `Follow-up due azi: ${dueToday}`
  ].join("\n");
}

export async function notifyAdmins(text: string, options?: { excludeChatIds?: number[] }) {
  const admin = createSupabaseServiceClient();
  const adminsResult = await admin.from("telegram_admins").select("chat_id").eq("is_active", true);
  if (adminsResult.error) throw adminsResult.error;

  const excluded = new Set((options?.excludeChatIds ?? []).filter((id) => Number.isFinite(id)));

  for (const row of adminsResult.data ?? []) {
    const chatId = Number((row as { chat_id: number }).chat_id);
    if (!Number.isFinite(chatId) || excluded.has(chatId)) continue;

    try {
      await sendTelegramMessage(chatId, text);
    } catch {
      // Continue notifying other admins even if one chat fails.
    }
  }
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  try {
    validateTelegramRoleConfig();
  } catch {
    // Never block command handling because of role config validation.
  }

  const message = update.message;
  const text = message?.text?.trim();
  const from = message?.from;
  const chat = message?.chat;

  if (!text || !from || !chat) {
    return { ok: true, ignored: true };
  }

  let actor: { id: string; role: "owner" | "admin" | "operator" };
  try {
    actor = await upsertTelegramAdmin(from, chat.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu te pot autentifica in acest moment.";
    await sendTelegramMessage(chat.id, message);
    return { ok: true, unauthorized: true };
  }

  const actorContext = {
    role: actor.role,
    actorLabel: from.username ?? from.first_name ?? String(from.id),
    telegramAdminId: actor.id
  };

  const { command, args } = parseCommandInput(text);
  let responseText = "Comanda nu este recunoscuta. Foloseste /help pentru lista completa.";

  try { switch (command) {
    case "/start": {
      await setTelegramCommands();
      responseText = [
        "Botul de outreach este pregatit.",
        "Fluxul este secvential: o singura nisa activa si o singura zona activa.",
        "Foloseste /status, /health, /stats, /queue, /coverage, /pause, /resume, /approve-next, /report sau /replies."
      ].join("\n");
      break;
    }
    case "/status": {
      responseText = formatStatusText(await getOperationalSnapshot());
      break;
    }
    case "/health": {
      responseText = await formatHealthText();
      break;
    }
    case "/stats": {
      responseText = await formatStatsText();
      break;
    }
    case "/queue": {
      responseText = await formatQueueText();
      break;
    }
    case "/scrape":
    case "/scrap": {
      const scrapeResult = await runScraperOrchestration({ notifyAlerts: false });
      const qualificationResult = await runQualificationPipeline({ zoneId: scrapeResult.zoneId });
      responseText = [
        "🔎 Scrape profesional finalizat.",
        `Localitati procesate: ${scrapeResult.localitiesProcessed}`,
        `Lead-uri descoperite: ${scrapeResult.discovered}`,
        `Lead-uri inserate: ${scrapeResult.inserted}`,
        scrapeResult.scrapeIssuesCount > 0 ? `Localitati cu erori de scraping: ${scrapeResult.scrapeIssuesCount}` : null,
        scrapeResult.lowYield ? "Avertizare: yield mic pe rularea curenta." : null,
        "",
        "✅ Calificare finalizata:",
        `Qualified: ${qualificationResult.qualified}`,
        `Review: ${qualificationResult.review}`,
        `Rejected: ${qualificationResult.rejected}`,
        `Suppressed: ${qualificationResult.suppressed}`,
        `Contacted: ${qualificationResult.contacted}`
      ].filter(Boolean).join("\n");
      break;
    }
    case "/send": {
      const parsedBatch = args[0] ? Number(args[0]) : null;
      const maxBatchSizeOverride = parsedBatch && Number.isInteger(parsedBatch) && parsedBatch > 0
        ? Math.min(parsedBatch, 100)
        : undefined;
      const result = await runOutreachScheduler({ forceStart: true, maxBatchSizeOverride });
      responseText = result.ok
        ? [
            "📤 Trimitere manuala executata.",
            maxBatchSizeOverride ? `Batch cerut: ${maxBatchSizeOverride}` : null,
            result.reason ? `Detalii: ${result.reason}` : null,
            result.sent !== undefined ? `Trimise: ${result.sent}` : null,
            result.failed !== undefined ? `Esuate: ${result.failed}` : null
          ].filter(Boolean).join("\n")
        : "Trimiterea nu a putut fi pornita acum.";
      break;
    }
    case "/delivery": {
      responseText = await formatDeliveryStatusText();
      break;
    }
    case "/coverage": {
      responseText = formatCoverageText(await getCoverageSnapshot());
      break;
    }
    case "/next": {
      const snapshot = await getOperationalSnapshot();
      responseText = snapshot?.nextZone
        ? `Urmatoarea zona planificata este ${snapshot.nextZone.display_name}.`
        : "Nu mai exista alta zona planificata in nisa curenta. Asteapta confirmare pentru nisa urmatoare.";
      break;
    }
    case "/exhaustion": {
      const snapshot = await getOperationalSnapshot();
      if (!snapshot) {
        responseText = "Nu exista o zona activa pentru analiza de epuizare.";
        break;
      }
      try {
        const exhaustion = await evaluateAndUpdateZoneExhaustion(snapshot.zone.id);
        responseText = [
          `📊 Zona: ${snapshot.zone.display_name}`,
          `Status epuizare: ${exhaustion.stage}`,
          `Scor: ${Math.round(exhaustion.score)}%`,
          "",
          ...exhaustion.reasons.slice(0, 2),
          "",
          exhaustion.stage === "exhausted_candidate" || exhaustion.stage === "exhausted_final"
            ? "⚠️ Recomandare: foloseste /approve-next pentru trecere"
            : "✓ Zona este activa, continua operarea"
        ].filter(Boolean).join("\n");
      } catch (error) {
        responseText = `Eroare la calculul epuizarii: ${error instanceof Error ? error.message : "unknown"}`;
      }
      break;
    }
    case "/pause": {
      const snapshot = await pauseActiveOutreach(actorContext);
      responseText = `Trimitere oprita. Zona ${snapshot.zone.display_name} este acum pe pauza.`;
      break;
    }
    case "/resume": {
      const zone = await resumeActiveOutreach(actorContext);
      if (zone.status === "sending") {
        await runOutreachScheduler({ forceStart: true });
      }
      responseText = `Trimitere reluata. Zona activa este acum in statusul ${zone.status}.`;
      break;
    }
    case "/approve-next": {
      const result = await approveNextOperationalUnit(actorContext);
      responseText =
        result.type === "complete"
          ? "Toate nisele si zonele initiale au fost parcurse. Nu mai exista urmatorul pas configurat."
          : `Aprobarea a fost inregistrata. Urmatorul pas activ: ${result.next?.display_name ?? "n/a"}.`;
      break;
    }
    case "/replies": {
      const replies = await listRecentReplyEvents(5);
      responseText = replies.length
        ? [
            "📧 REPLY-URI RECENTE",
            "",
            ...replies.slice(0, 5).map((row, index) => {
              const reply = row as { event_type: string; from_value: string | null; summary: string | null };
              const emoji = reply.event_type === "positive_reply" ? "✅" : reply.event_type === "booking_intent" ? "📅" : "💬";
              return `${emoji} ${index + 1}. ${reply.from_value ?? "Lead necunoscut"}\nTip: ${reply.event_type}${reply.summary ? `\nRezumat: ${reply.summary}` : ""}`;
            })
          ].join("\n")
        : "Nu exista reply-uri noi in acest moment.";
      break;
    }
    case "/report": {
      try {
        const reports = await buildDailyReports();
        const broadcast = args.some((arg) => ["all", "broadcast", "team"].includes(arg.toLowerCase()));
        responseText = [
          "📊 RAPORT ZILEI",
          "",
          reports.operational,
          "",
          reports.coverage,
          "",
          reports.efficiency
        ].join("\n");
        if (broadcast) {
          await notifyAdmins(responseText, { excludeChatIds: [chat.id] });
        }
      } catch (error) {
        responseText = `Eroare la generarea raportului: ${error instanceof Error ? error.message : "unknown"}`;
      }
      break;
    }
    case "/deliverability": {
      try {
        const report = await getDeliverabilityReport();
        responseText = report.formattedText;
      } catch (error) {
        responseText = `Eroare la verificarea deliverability: ${error instanceof Error ? error.message : "unknown"}`;
      }
      break;
    }
    case "/help": {
      responseText = buildHelpMessage();
      break;
    }
    default:
      break;
  } } catch (cmdError) {
    responseText = `Eroare la executia comenzii ${command}: ${cmdError instanceof Error ? cmdError.message : "eroare necunoscuta"}`;
  }
  try {
    await recordOperatorAction({
      actionType: command.replace(/^\//, "") || "unknown_command",
      actor: actorContext,
      targetType: "telegram_command",
      notes: `Comanda executata: ${command}`,
      payload: { command }
    });
  } catch {
    // Bot response should still be delivered even if audit logging fails.
  }

  try {
    await sendTelegramMessage(chat.id, responseText);
  } catch {
    // Keep webhook stable even if Telegram API rejects a response.
  }
  return { ok: true };
}