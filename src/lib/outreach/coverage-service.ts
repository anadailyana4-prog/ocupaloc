import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { logInfo } from "@/lib/logger";
import { buildCoverageZoneTransition, getResumeStatus } from "@/lib/outreach/ops-state-machine";
import type { OutreachZoneStatus, TelegramAdminRole } from "@/lib/outreach/ops-constants";

interface NicheRow {
  id: string;
  slug: string;
  display_name: string;
  execution_order: number;
  is_active: boolean;
}

interface ZoneRow {
  id: string;
  niche_id: string;
  slug: string;
  display_name: string;
  execution_order: number;
  status: OutreachZoneStatus;
  is_active: boolean;
  paused_from_status: OutreachZoneStatus | null;
  exhaustion_stage: string;
  exhaustion_score: number;
  discovered_leads_count: number;
  qualified_leads_count: number;
  contacted_leads_count: number;
  replies_count: number;
  bounce_count: number;
  remaining_leads_count: number;
  duplicate_leads_count: number;
  uncontactable_leads_count: number;
  last_scrape_new_valid_leads: number;
  scraping_completed: boolean;
}

interface ZoneExhaustionMetrics {
  id: string;
  niche_id: string;
  discovered_leads_count: number;
  qualified_leads_count: number;
  contacted_leads_count: number;
  duplicate_leads_count: number;
  uncontactable_leads_count: number;
  already_contacted_leads_count: number;
  suppressed_leads_count: number;
  last_scrape_new_valid_leads: number;
  scraping_completed: boolean;
  last_scrape_new_leads: number;
  scrape_runs_count: number;
  low_yield_runs_count: number;
  rerun_history?: number[];
}

export interface ActorContext {
  role: TelegramAdminRole;
  actorLabel: string;
  telegramAdminId?: string;
}

export interface OperationalSnapshot {
  niche: NicheRow;
  zone: ZoneRow;
  nextZone: ZoneRow | null;
}

function getAdmin() {
  return createSupabaseServiceClient();
}

export async function getActiveNiche() {
  const admin = getAdmin();
  const active = await admin
    .from("niches")
    .select("id, slug, display_name, execution_order, is_active")
    .eq("is_active", true)
    .order("execution_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (active.error) {
    throw active.error;
  }

  if (active.data) {
    return active.data as NicheRow;
  }

  const fallback = await admin
    .from("niches")
    .select("id, slug, display_name, execution_order, is_active")
    .order("execution_order", { ascending: true })
    .limit(1)
    .single();

  if (fallback.error) {
    throw fallback.error;
  }

  return fallback.data as NicheRow;
}

export async function getZonesForNiche(nicheId: string) {
  const admin = getAdmin();
  const result = await admin
    .from("coverage_zones")
    .select(
      "id, niche_id, slug, display_name, execution_order, status, is_active, paused_from_status, exhaustion_stage, exhaustion_score, discovered_leads_count, qualified_leads_count, contacted_leads_count, replies_count, bounce_count, remaining_leads_count, duplicate_leads_count, uncontactable_leads_count, last_scrape_new_valid_leads, scraping_completed"
    )
    .eq("niche_id", nicheId)
    .order("execution_order", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []) as ZoneRow[];
}

export async function getActiveZone(nicheId?: string) {
  const activeNiche = nicheId ? null : await getActiveNiche();
  const targetNicheId = nicheId ?? activeNiche?.id;
  if (!targetNicheId) {
    return null;
  }

  const zones = await getZonesForNiche(targetNicheId);
  return zones.find((zone) => zone.is_active) ?? zones.find((zone) => zone.status !== "exhausted") ?? null;
}

export async function getNextZone(nicheId: string, currentOrder: number) {
  const zones = await getZonesForNiche(nicheId);
  return zones.find((zone) => zone.execution_order > currentOrder && zone.status !== "exhausted") ?? null;
}

export async function getOperationalSnapshot(): Promise<OperationalSnapshot | null> {
  const niche = await getActiveNiche();
  const zone = await getActiveZone(niche.id);
  if (!zone) {
    return null;
  }

  const nextZone = await getNextZone(niche.id, zone.execution_order);
  return { niche, zone, nextZone };
}

export async function syncZoneCountersFromData(zoneId: string) {
  const admin = getAdmin();

  const leadsResult = await admin.from("leads").select("id, qualification_status").eq("coverage_zone_id", zoneId);
  if (leadsResult.error) {
    throw leadsResult.error;
  }

  const leadIds = (leadsResult.data ?? []).map((row) => (row as { id: string }).id);

  const messagesResult =
    leadIds.length > 0
      ? await admin.from("outreach_messages").select("status, lead_id").in("lead_id", leadIds)
      : { data: [], error: null };

  const replyEventsResult =
    leadIds.length > 0
      ? await admin.from("reply_events").select("event_type, lead_id").in("lead_id", leadIds)
      : { data: [], error: null };

  if (messagesResult.error) {
    throw messagesResult.error;
  }

  if (replyEventsResult.error) {
    throw replyEventsResult.error;
  }

  const counts = {
    discovered: leadsResult.data?.length ?? 0,
    qualified: 0,
    contacted: 0,
    remaining: 0,
    duplicates: 0,
    uncontactable: 0,
    suppressed: 0,
    replies: 0,
    bounces: 0,
    alreadyContacted: 0
  };

  for (const row of leadsResult.data ?? []) {
    const status = (row as { qualification_status: string }).qualification_status;
    if (status === "qualified") counts.qualified += 1;
    if (status === "contacted") counts.contacted += 1;
    if (status === "replied") counts.contacted += 1;
    if (status === "review") counts.remaining += 1;
    if (status === "qualified") counts.remaining += 1;
    if (status === "rejected") counts.uncontactable += 1;
    if (status === "suppressed") counts.suppressed += 1;
  }

  for (const row of messagesResult.data ?? []) {
    const status = (row as { status: string }).status;
    if (status === "sent" || status === "replied") counts.alreadyContacted += 1;
    if (status === "bounced") counts.bounces += 1;
  }

  for (const row of replyEventsResult.data ?? []) {
    const eventType = (row as { event_type: string }).event_type;
    if (eventType === "reply" || eventType === "positive_reply" || eventType === "booking_intent") {
      counts.replies += 1;
    }
  }

  const update = await admin
    .from("coverage_zones")
    .update({
      discovered_leads_count: counts.discovered,
      qualified_leads_count: counts.qualified,
      contacted_leads_count: counts.alreadyContacted,
      replies_count: counts.replies,
      bounce_count: counts.bounces,
      remaining_leads_count: Math.max(0, counts.remaining - counts.alreadyContacted),
      uncontactable_leads_count: counts.uncontactable,
      suppressed_leads_count: counts.suppressed,
      already_contacted_leads_count: counts.alreadyContacted,
      updated_at: new Date().toISOString()
    })
    .eq("id", zoneId);

  if (update.error) {
    throw update.error;
  }

  return counts;
}

export async function transitionCoverageZoneStatus(input: {
  zoneId: string;
  toStatus: OutreachZoneStatus;
  reason: string;
  changedByType: "system" | "telegram" | "operator" | "cron";
  changedById?: string;
  context?: Record<string, string | number | boolean | null>;
}) {
  const admin = getAdmin();
  const zoneResult = await admin
    .from("coverage_zones")
    .select(
      "id, status, paused_from_status, niche_id, slug, display_name, execution_order, is_active, exhaustion_stage, exhaustion_score, discovered_leads_count, qualified_leads_count, contacted_leads_count, replies_count, bounce_count, remaining_leads_count, duplicate_leads_count, uncontactable_leads_count, last_scrape_new_valid_leads, scraping_completed"
    )
    .eq("id", input.zoneId)
    .single();

  if (zoneResult.error) {
    throw zoneResult.error;
  }

  const zone = zoneResult.data as ZoneRow;
  const transition = buildCoverageZoneTransition({
    zoneId: zone.id,
    fromStatus: zone.status,
    toStatus: input.toStatus,
    reason: input.reason,
    changedByType: input.changedByType,
    changedById: input.changedById,
    context: input.context ?? {}
  });

  const updates: Record<string, unknown> = {
    status: transition.toStatus,
    last_transition_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (transition.toStatus === "paused") {
    updates.paused_from_status = transition.fromStatus;
  }

  if (transition.fromStatus === "paused" && transition.toStatus !== "paused") {
    updates.paused_from_status = null;
  }

  const update = await admin.from("coverage_zones").update(updates).eq("id", zone.id);
  if (update.error) {
    throw update.error;
  }

  const historyInsert = await admin.from("coverage_zone_status_history").insert({
    coverage_zone_id: zone.id,
    from_status: transition.fromStatus,
    to_status: transition.toStatus,
    reason: transition.reason,
    transition_context: transition.context,
    changed_by_type: transition.changedByType,
    changed_by_id: transition.changedById ?? null
  });

  if (historyInsert.error) {
    throw historyInsert.error;
  }

  logInfo("coverage_zone_transition", {
    zoneId: zone.id,
    fromStatus: transition.fromStatus,
    toStatus: transition.toStatus
  });

  return { ...zone, status: transition.toStatus, paused_from_status: updates.paused_from_status as OutreachZoneStatus | null };
}

export async function recordOperatorAction(action: {
  actionType: string;
  actor: ActorContext;
  targetType: string;
  targetId?: string;
  notes?: string;
  payload?: Record<string, unknown>;
}) {
  const admin = getAdmin();
  const result = await admin.from("operator_actions").insert({
    action_type: action.actionType,
    role: action.actor.role,
    actor_label: action.actor.actorLabel,
    telegram_admin_id: action.actor.telegramAdminId ?? null,
    target_type: action.targetType,
    target_id: action.targetId ?? null,
    notes: action.notes ?? null,
    payload: action.payload ?? {}
  });

  if (result.error) {
    throw result.error;
  }
}

export async function pauseActiveOutreach(actor: ActorContext) {
  const snapshot = await getOperationalSnapshot();
  if (!snapshot) {
    throw new Error("Nu exista o zona activa.");
  }

  if (!["ready", "sending", "cooldown"].includes(snapshot.zone.status)) {
    throw new Error("Trimiterea nu poate fi pusa pe pauza in statusul curent.");
  }

  await transitionCoverageZoneStatus({
    zoneId: snapshot.zone.id,
    toStatus: "paused",
    reason: "Pauza ceruta din Telegram",
    changedByType: "telegram",
    changedById: actor.telegramAdminId,
    context: { actor: actor.actorLabel }
  });

  const admin = getAdmin();
  await admin.from("outreach_campaigns").update({ status: "paused", updated_at: new Date().toISOString() }).eq("coverage_zone_id", snapshot.zone.id);
  await recordOperatorAction({
    actionType: "pause_outreach",
    actor,
    targetType: "coverage_zone",
    targetId: snapshot.zone.id,
    notes: `Zona ${snapshot.zone.display_name} a fost pusa pe pauza.`
  });

  return snapshot;
}

export async function resumeActiveOutreach(actor: ActorContext) {
  const snapshot = await getOperationalSnapshot();
  if (!snapshot) {
    throw new Error("Nu exista o zona activa.");
  }

  if (snapshot.zone.status !== "paused") {
    throw new Error("Zona activa nu este pe pauza.");
  }

  const nextStatus = getResumeStatus(snapshot.zone.paused_from_status);
  const zone = await transitionCoverageZoneStatus({
    zoneId: snapshot.zone.id,
    toStatus: nextStatus,
    reason: "Reluare ceruta din Telegram",
    changedByType: "telegram",
    changedById: actor.telegramAdminId,
    context: { actor: actor.actorLabel }
  });

  const admin = getAdmin();
  await admin
    .from("outreach_campaigns")
    .update({ status: nextStatus === "sending" ? "active" : "ready", updated_at: new Date().toISOString() })
    .eq("coverage_zone_id", snapshot.zone.id);

  await recordOperatorAction({
    actionType: "resume_outreach",
    actor,
    targetType: "coverage_zone",
    targetId: snapshot.zone.id,
    notes: `Zona ${snapshot.zone.display_name} a fost reluata in statusul ${zone.status}.`
  });

  return zone;
}

export async function approveNextOperationalUnit(actor: ActorContext) {
  const admin = getAdmin();
  const currentNiche = await getActiveNiche();
  const currentZone = await getActiveZone(currentNiche.id);

  if (!currentZone) {
    throw new Error("Nu exista o zona activa pentru aprobare.");
  }

  const nextZone = await getNextZone(currentNiche.id, currentZone.execution_order);
  if (nextZone) {
    if (currentZone.status !== "exhausted") {
      await transitionCoverageZoneStatus({
        zoneId: currentZone.id,
        toStatus: "exhausted",
        reason: "Trecere aprobata manual la urmatoarea zona",
        changedByType: "telegram",
        changedById: actor.telegramAdminId,
        context: { actor: actor.actorLabel }
      });
    }

    await admin.from("coverage_zones").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", currentZone.id);
    await admin.from("coverage_zones").update({ is_active: true, updated_at: new Date().toISOString() }).eq("id", nextZone.id);

    if (nextZone.status === "planned") {
      await transitionCoverageZoneStatus({
        zoneId: nextZone.id,
        toStatus: "scraping",
        reason: "Trecere aprobata manual din Telegram",
        changedByType: "telegram",
        changedById: actor.telegramAdminId,
        context: { actor: actor.actorLabel }
      });
    }

    await recordOperatorAction({
      actionType: "approve_next_zone",
      actor,
      targetType: "coverage_zone",
      targetId: nextZone.id,
      notes: `Aprobata trecerea la zona ${nextZone.display_name}.`
    });

    return {
      type: "zone",
      previous: currentZone,
      next: nextZone,
      niche: currentNiche
    };
  }

  const nextNicheResult = await admin
    .from("niches")
    .select("id, slug, display_name, execution_order, is_active")
    .gt("execution_order", currentNiche.execution_order)
    .order("execution_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (nextNicheResult.error) {
    throw nextNicheResult.error;
  }

  if (!nextNicheResult.data) {
    return { type: "complete", previous: currentZone, next: null, niche: currentNiche };
  }

  const nextNiche = nextNicheResult.data as NicheRow;
  const nextNicheZones = await getZonesForNiche(nextNiche.id);
  const firstZone = nextNicheZones[0];
  if (!firstZone) {
    throw new Error("Nisa urmatoare nu are zone configurate.");
  }

  await admin.from("niches").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", currentNiche.id);
  await admin.from("niches").update({ is_active: true, updated_at: new Date().toISOString() }).eq("id", nextNiche.id);
  await admin.from("coverage_zones").update({ is_active: false, updated_at: new Date().toISOString() }).eq("niche_id", currentNiche.id);
  await admin.from("coverage_zones").update({ is_active: true, updated_at: new Date().toISOString() }).eq("id", firstZone.id);

  if (firstZone.status === "planned") {
    await transitionCoverageZoneStatus({
      zoneId: firstZone.id,
      toStatus: "scraping",
      reason: "Aprobata trecerea la nisa urmatoare",
      changedByType: "telegram",
      changedById: actor.telegramAdminId,
      context: { actor: actor.actorLabel }
    });
  }

  await recordOperatorAction({
    actionType: "approve_next_niche",
    actor,
    targetType: "niche",
    targetId: nextNiche.id,
    notes: `Aprobata trecerea la nisa ${nextNiche.display_name}.`
  });

  return {
    type: "niche",
    previous: currentZone,
    next: firstZone,
    niche: nextNiche
  };
}

export async function getCoverageSnapshot() {
  const niche = await getActiveNiche();
  const zones = await getZonesForNiche(niche.id);
  const activeZone = zones.find((zone) => zone.is_active) ?? zones[0] ?? null;
  const completed = zones.filter((zone) => zone.status === "exhausted").length;
  const inWork = zones.filter((zone) => ["scraping", "qualifying", "ready", "sending", "cooldown", "paused"].includes(zone.status)).length;
  const planned = zones.filter((zone) => zone.status === "planned").length;
  const nextZone = activeZone ? zones.find((zone) => zone.execution_order > activeZone.execution_order && zone.status !== "exhausted") ?? null : null;

  return {
    niche,
    zones,
    activeZone,
    nextZone,
    completed,
    inWork,
    planned,
    progressPercent: zones.length > 0 ? Number(((completed / zones.length) * 100).toFixed(1)) : 0
  };
}

export async function evaluateAndUpdateZoneExhaustion(zoneId: string) {
  const { evaluateZoneExhaustion } = await import("@/lib/outreach/exhaustion");
  const admin = getAdmin();

  const zoneResult = await admin
    .from("coverage_zones")
    .select(
      "id, niche_id, discovered_leads_count, qualified_leads_count, contacted_leads_count, " +
      "duplicate_leads_count, uncontactable_leads_count, already_contacted_leads_count, " +
      "suppressed_leads_count, last_scrape_new_valid_leads, scraping_completed, " +
      "last_scrape_new_leads, scrape_runs_count, low_yield_runs_count, rerun_history"
    )
    .eq("id", zoneId)
    .single();

  if (zoneResult.error) {
    throw zoneResult.error;
  }

  const zone = zoneResult.data as unknown as ZoneExhaustionMetrics;

  if (!zone) {
    throw new Error(`Zone not found: ${zoneId}`);
  }

  // Get previous run stats from history or default
  const previousNewValidLeads = (zone.rerun_history && zone.rerun_history.length > 0) 
    ? zone.rerun_history[0] 
    : zone.last_scrape_new_leads ?? 0;

  const exhaustionResult = evaluateZoneExhaustion({
    scrapingCompleted: zone.scraping_completed ?? false,
    scrapeRunsCount: zone.scrape_runs_count ?? 0,
    latestNewValidLeads: zone.last_scrape_new_valid_leads ?? 0,
    previousNewValidLeads: Math.max(0, previousNewValidLeads),
    rerunHistory: zone.rerun_history ?? [],
    remainingContactableLeads: Math.max(0, (zone.qualified_leads_count ?? 0) - (zone.contacted_leads_count ?? 0)),
    duplicateLeads: zone.duplicate_leads_count ?? 0,
    uncontactableLeads: zone.uncontactable_leads_count ?? 0,
    suppressedLeads: zone.suppressed_leads_count ?? 0,
    alreadyContactedLeads: zone.already_contacted_leads_count ?? 0,
    lowYieldRunsCount: zone.low_yield_runs_count ?? 0,
    usefulYieldRate: (zone.qualified_leads_count ?? 0) > 0 
      ? (zone.last_scrape_new_valid_leads ?? 0) / (zone.qualified_leads_count ?? 1)
      : 0,
    confirmationRunsWithoutUsefulVolume: 0
  });

  // Update zone with exhaustion results
  const updateResult = await admin
    .from("coverage_zones")
    .update({
      exhaustion_score: exhaustionResult.score,
      exhaustion_stage: exhaustionResult.stage,
      exhaustion_reason: exhaustionResult.reasons.join(" "),
      updated_at: new Date().toISOString()
    })
    .eq("id", zoneId);

  if (updateResult.error) {
    throw updateResult.error;
  }

  return exhaustionResult;
}