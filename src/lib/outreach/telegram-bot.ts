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
    throw new Error(`TELEGRAM_*_IDS contine valori invalide: ${invalid.join(", ")}`);
  }

  const overlapOwnerAdmin = [...owner.values].filter((id) => admin.values.has(id));
  const overlapOwnerOperator = [...owner.values].filter((id) => operator.values.has(id));
  const overlapAdminOperator = [...admin.values].filter((id) => operator.values.has(id));

  if (overlapOwnerAdmin.length || overlapOwnerOperator.length || overlapAdminOperator.length) {
    throw new Error("TELEGRAM_OWNER_IDS, TELEGRAM_ADMIN_IDS si TELEGRAM_OPERATOR_IDS nu trebuie sa contina ID-uri suprapuse.");
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
    "Comenzi disponibile:",
    OUTREACH_COMMANDS.map((item) => `/${item.command} - ${item.description}`).join("\n"),
    "",
    "Comenzi operationale rapide:",
    "/pause - opreste temporar trimiterea",
    "/resume - reia trimiterea controlata",
    "/approve-next - confirma trecerea la urmatoarea zona sau nisa"
  ].join("\n");
}

export async function sendTelegramMessage(chatId: number, text: string) {
  await sendTelegramRequest("sendMessage", { chat_id: chatId, text });
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

function parseCommand(text: string) {
  const [command] = text.trim().split(/\s+/);
  return command.toLowerCase().replace(/_/g, "-");
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

export async function notifyAdmins(text: string) {
  const admin = createSupabaseServiceClient();
  const adminsResult = await admin.from("telegram_admins").select("chat_id").eq("is_active", true);
  if (adminsResult.error) throw adminsResult.error;

  for (const row of adminsResult.data ?? []) {
    const chatId = Number((row as { chat_id: number }).chat_id);
    if (Number.isFinite(chatId)) {
      await sendTelegramMessage(chatId, text);
    }
  }
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  validateTelegramRoleConfig();

  const message = update.message;
  const text = message?.text?.trim();
  const from = message?.from;
  const chat = message?.chat;

  if (!text || !from || !chat) {
    return { ok: true, ignored: true };
  }

  const actor = await upsertTelegramAdmin(from, chat.id);
  const actorContext = {
    role: actor.role,
    actorLabel: from.username ?? from.first_name ?? String(from.id),
    telegramAdminId: actor.id
  };

  const command = parseCommand(text);
  let responseText = "Comanda nu este recunoscuta. Foloseste /help pentru lista completa.";

  switch (command) {
    case "/start": {
      await setTelegramCommands();
      responseText = [
        "Botul de outreach este pregatit.",
        "Fluxul este secvential: o singura nisa activa si o singura zona activa.",
        "Foloseste /status, /coverage, /pause, /resume, /approve-next, /report sau /replies."
      ].join("\n");
      break;
    }
    case "/status": {
      responseText = formatStatusText(await getOperationalSnapshot());
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
        responseText = [
          "📊 RAPORT ZILEI",
          "",
          reports.operational,
          "",
          reports.coverage,
          "",
          reports.efficiency
        ].join("\n");
        await notifyAdmins(responseText);
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
  }
  await recordOperatorAction({
    actionType: command.replace(/^\//, "") || "unknown_command",
    actor: actorContext,
    targetType: "telegram_command",
    notes: `Comanda executata: ${command}`,
    payload: { command }
  });

  await sendTelegramMessage(chat.id, responseText);
  return { ok: true };
}