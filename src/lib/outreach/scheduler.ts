import { env } from "@/lib/config/env";
import { evaluateZoneExhaustion } from "@/lib/outreach/exhaustion";
import { DEFAULT_OUTREACH_LIMITS } from "@/lib/outreach/ops-constants";
import { generatePersonalizedOutreach } from "@/lib/outreach/personalization-engine";
import { listRecentReplyEvents } from "@/lib/outreach/reply-events";
import { sendOutreachMailboxEmail } from "@/lib/outreach/mailbox-send";
import {
  getOperationalSnapshot,
  syncZoneCountersFromData,
  transitionCoverageZoneStatus
} from "@/lib/outreach/coverage-service";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

interface EligibleLead {
  leadId: string;
  contactId: string;
  email: string;
  businessName: string;
  city: string;
  website: string | null;
  observableSignals: Record<string, boolean | string | number | null>;
}

export function computeBatchCapacity(input: {
  perHourLimit: number;
  perDayLimit: number;
  maxBatchSize: number;
  sentLastHour: number;
  sentToday: number;
}) {
  return Math.max(
    0,
    Math.min(
      input.perHourLimit - input.sentLastHour,
      input.perDayLimit - input.sentToday,
      input.maxBatchSize
    )
  );
}

export function shouldSkipFollowUp(input: {
  qualificationStatus: string;
  isSuppressed: boolean;
  hasReplyEvent: boolean;
}) {
  if (input.isSuppressed) return true;
  if (input.hasReplyEvent) return true;
  return ["replied", "suppressed", "closed"].includes(input.qualificationStatus);
}

function getCampaignLimits() {
  return {
    perHour: Number(env.optional("OUTREACH_SEND_LIMIT_PER_HOUR") ?? DEFAULT_OUTREACH_LIMITS.perHour),
    perDay: Number(env.optional("OUTREACH_SEND_LIMIT_PER_DAY") ?? DEFAULT_OUTREACH_LIMITS.perDay),
    followUpDelayDays: Number(env.optional("OUTREACH_FOLLOW_UP_DELAY_DAYS") ?? DEFAULT_OUTREACH_LIMITS.followUpDelayDays),
    maxBatchSize: Number(env.optional("OUTREACH_BATCH_SIZE") ?? DEFAULT_OUTREACH_LIMITS.maxBatchSize)
  };
}

async function ensureCampaignForZone(input: { nicheId: string; nicheSlug: string; zoneId: string; zoneName: string }) {
  const admin = createSupabaseServiceClient();
  const existing = await admin.from("outreach_campaigns").select("id, slug, status").eq("coverage_zone_id", input.zoneId).limit(1).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data as { id: string; slug: string; status: string };

  const limits = getCampaignLimits();
  const slug = `${input.nicheSlug}-${input.zoneName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const insert = await admin
    .from("outreach_campaigns")
    .insert({
      niche_id: input.nicheId,
      coverage_zone_id: input.zoneId,
      slug,
      display_name: `${input.nicheSlug} ${input.zoneName}`,
      status: "ready",
      send_limit_per_hour: limits.perHour,
      send_limit_per_day: limits.perDay,
      follow_up_delay_days: limits.followUpDelayDays,
      follow_up_enabled: true,
      start_requires_manual_trigger: true
    })
    .select("id, slug, status")
    .single();
  if (insert.error) throw insert.error;
  return insert.data as { id: string; slug: string; status: string };
}

async function countRecentMessages(campaignId: string) {
  const admin = createSupabaseServiceClient();
  const now = Date.now();
  const lastHourIso = new Date(now - 60 * 60 * 1000).toISOString();
  const startOfDayIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

  const hourResult = await admin
    .from("outreach_messages")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("status", "sent")
    .gte("sent_at", lastHourIso);
  if (hourResult.error) throw hourResult.error;

  const dayResult = await admin
    .from("outreach_messages")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("status", "sent")
    .gte("sent_at", startOfDayIso);
  if (dayResult.error) throw dayResult.error;

  return {
    lastHour: hourResult.data?.length ?? 0,
    today: dayResult.data?.length ?? 0
  };
}

async function getEligibleInitialLeads(zoneId: string, campaignId: string, limit: number): Promise<EligibleLead[]> {
  const admin = createSupabaseServiceClient();
  const leadsResult = await admin
    .from("leads")
    .select("id, business_name, website, observable_signals")
    .eq("coverage_zone_id", zoneId)
    .eq("qualification_status", "qualified")
    .limit(100);
  if (leadsResult.error) throw leadsResult.error;

  const leadIds = (leadsResult.data ?? []).map((row) => (row as { id: string }).id);
  if (leadIds.length === 0) {
    return [];
  }

  const sentResult = await admin.from("outreach_messages").select("lead_id").eq("campaign_id", campaignId).in("lead_id", leadIds);
  if (sentResult.error) throw sentResult.error;
  const sentLeadIds = new Set((sentResult.data ?? []).map((row) => (row as { lead_id: string }).lead_id));

  const contactsResult = await admin
    .from("lead_contacts")
    .select("id, lead_id, normalized_value, is_primary")
    .eq("channel", "email")
    .eq("is_valid", true)
    .in("lead_id", leadIds);
  if (contactsResult.error) throw contactsResult.error;

  const suppressionResult = await admin.from("suppression_list").select("normalized_value").eq("channel", "email");
  if (suppressionResult.error) throw suppressionResult.error;
  const suppressedEmails = new Set(
    (suppressionResult.data ?? []).map((row) => (row as { normalized_value: string }).normalized_value)
  );

  const byLead = new Map((leadsResult.data ?? []).map((row) => [(row as { id: string }).id, row as { id: string; business_name: string; website: string | null; observable_signals: Record<string, boolean | string | number | null> }]));

  const eligible: EligibleLead[] = [];
  for (const row of contactsResult.data ?? []) {
    const contact = row as { id: string; lead_id: string; normalized_value: string; is_primary: boolean };
    if (sentLeadIds.has(contact.lead_id)) {
      continue;
    }
    if (suppressedEmails.has(contact.normalized_value)) {
      continue;
    }
    const lead = byLead.get(contact.lead_id);
    if (!lead) continue;
    eligible.push({
      leadId: lead.id,
      contactId: contact.id,
      email: contact.normalized_value,
      businessName: lead.business_name,
      city: "zona activa",
      website: lead.website,
      observableSignals: lead.observable_signals ?? {}
    });
    if (eligible.length >= limit) break;
  }

  return eligible;
}

async function getDueFollowUps(campaignId: string, limit: number) {
  const admin = createSupabaseServiceClient();
  const result = await admin
    .from("outreach_followups")
    .select("id, lead_id, initial_message_id, due_at")
    .eq("campaign_id", campaignId)
    .eq("status", "scheduled")
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true })
    .limit(limit);

  if (result.error) throw result.error;
  return result.data ?? [];
}

async function getFollowUpLead(leadId: string) {
  const admin = createSupabaseServiceClient();
  const leadResult = await admin
    .from("leads")
    .select("id, business_name, website, observable_signals, qualification_status")
    .eq("id", leadId)
    .single();
  if (leadResult.error) throw leadResult.error;

  const contactResult = await admin
    .from("lead_contacts")
    .select("id, normalized_value")
    .eq("lead_id", leadId)
    .eq("channel", "email")
    .eq("is_valid", true)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (contactResult.error) throw contactResult.error;
  if (!contactResult.data) return null;

  const suppressedResult = await admin
    .from("suppression_list")
    .select("id")
    .eq("channel", "email")
    .eq("normalized_value", (contactResult.data as { normalized_value: string }).normalized_value)
    .limit(1)
    .maybeSingle();
  if (suppressedResult.error) throw suppressedResult.error;

  const replyExistsResult = await admin
    .from("reply_events")
    .select("id")
    .eq("lead_id", leadId)
    .in("event_type", ["reply", "positive_reply", "booking_intent", "opt_out"])
    .limit(1)
    .maybeSingle();
  if (replyExistsResult.error) throw replyExistsResult.error;

  const lead = leadResult.data as {
    id: string;
    business_name: string;
    website: string | null;
    observable_signals: Record<string, boolean | string | number | null>;
    qualification_status: string;
  };
  const contact = contactResult.data as { id: string; normalized_value: string };

  if (
    shouldSkipFollowUp({
      qualificationStatus: lead.qualification_status,
      isSuppressed: Boolean(suppressedResult.data),
      hasReplyEvent: Boolean(replyExistsResult.data)
    })
  ) {
    return null;
  }

  return {
    leadId: lead.id,
    contactId: contact.id,
    email: contact.normalized_value,
    businessName: lead.business_name,
    city: "zona activa",
    website: lead.website,
    observableSignals: lead.observable_signals ?? {}
  } satisfies EligibleLead;
}

async function createBatch(campaignId: string, targetMessageCount: number) {
  const admin = createSupabaseServiceClient();
  const insert = await admin
    .from("outreach_batches")
    .insert({
      campaign_id: campaignId,
      batch_type: "initial",
      status: "running",
      scheduled_for: new Date().toISOString(),
      started_at: new Date().toISOString(),
      target_message_count: targetMessageCount,
      created_by_type: "cron"
    })
    .select("id")
    .single();
  if (insert.error) throw insert.error;
  return (insert.data as { id: string }).id;
}

export async function runOutreachScheduler(input?: { forceStart?: boolean; dryRun?: boolean }) {
  const snapshot = await getOperationalSnapshot();
  if (!snapshot) {
    return { ok: true, reason: "Nu exista nisa/zona activa." };
  }

  const admin = createSupabaseServiceClient();
  const campaign = await ensureCampaignForZone({
    nicheId: snapshot.niche.id,
    nicheSlug: snapshot.niche.slug,
    zoneId: snapshot.zone.id,
    zoneName: snapshot.zone.display_name
  });

  if (snapshot.zone.status === "ready" && input?.forceStart) {
    await transitionCoverageZoneStatus({
      zoneId: snapshot.zone.id,
      toStatus: "sending",
      reason: "Pornire manuala a trimiterei controlate",
      changedByType: "telegram"
    });
    await admin.from("outreach_campaigns").update({ status: "active", started_at: new Date().toISOString() }).eq("id", campaign.id);
  }

  if (!["sending", "cooldown"].includes(snapshot.zone.status) && !(snapshot.zone.status === "ready" && input?.forceStart)) {
    return { ok: true, reason: `Schedulerul a gasit zona in statusul ${snapshot.zone.status}.` };
  }

  const limits = getCampaignLimits();
  const counts = await countRecentMessages(campaign.id);
  const capacity = Math.max(
    0,
    computeBatchCapacity({
      perHourLimit: limits.perHour,
      perDayLimit: limits.perDay,
      maxBatchSize: limits.maxBatchSize,
      sentLastHour: counts.lastHour,
      sentToday: counts.today
    })
  );

  if (capacity <= 0) {
    if (snapshot.zone.status === "sending") {
      await transitionCoverageZoneStatus({
        zoneId: snapshot.zone.id,
        toStatus: "cooldown",
        reason: "A fost atinsa limita pe ora sau pe zi",
        changedByType: "cron"
      });
    }
    return { ok: true, reason: "Capacitate 0 pentru batch-ul curent.", counts };
  }

  if (snapshot.zone.status === "cooldown") {
    await transitionCoverageZoneStatus({
      zoneId: snapshot.zone.id,
      toStatus: "sending",
      reason: "Capacitate disponibila din nou dupa cooldown",
      changedByType: "cron"
    });
  }

  const followUps = await getDueFollowUps(campaign.id, capacity);
  const initialLeads = await getEligibleInitialLeads(snapshot.zone.id, campaign.id, capacity);
  const batchId = await createBatch(campaign.id, Math.min(capacity, followUps.length + initialLeads.length));

  let sent = 0;
  let failed = 0;
  const previews: Array<{ to: string; subject: string }> = [];
  const senderName = env.optional("OUTREACH_SENDER_NAME") ?? "Echipa OcupaLoc.ro";
  const siteUrl = env.optional("NEXT_PUBLIC_SITE_URL") ?? "https://ocupaloc.ro";
  const optOutBase = `${siteUrl}/api/leads/unsubscribe?lead=`;

  const initialTargets = initialLeads.slice(0, Math.max(0, capacity - followUps.length));

  for (const row of followUps.slice(0, capacity)) {
    const followUp = row as { id: string; lead_id: string; initial_message_id: string };
    const target = await getFollowUpLead(followUp.lead_id);
    if (!target) {
      await admin.from("outreach_followups").update({ status: "skipped", cancellation_reason: "Nu mai exista email valid" }).eq("id", followUp.id);
      continue;
    }

    const email = generatePersonalizedOutreach({
      nicheSlug: snapshot.niche.slug,
      businessName: target.businessName,
      city: target.city,
      website: target.website ?? undefined,
      observableSignals: {
        bookingLinkDetected: Boolean(target.observableSignals.bookingLinkDetected),
        instagramDetected: Boolean(target.observableSignals.instagramDetected),
        hasServiceMenu: Boolean(target.observableSignals.hasServiceMenu)
      },
      optOutUrl: `${optOutBase}${target.leadId}`,
      senderName
    });

    previews.push({ to: target.email, subject: email.followUpSubject });
    if (input?.dryRun) {
      continue;
    }

    const messageInsert = await admin
      .from("outreach_messages")
      .insert({
        campaign_id: campaign.id,
        batch_id: batchId,
        lead_id: target.leadId,
        lead_contact_id: target.contactId,
        message_kind: "follow_up",
        status: "queued",
        subject: email.followUpSubject,
        body_text: email.followUpText,
        body_html: email.followUpHtml,
        personalization_payload: {
          businessName: target.businessName,
          city: target.city,
          website: target.website,
          followUpFor: followUp.initial_message_id
        },
        opt_out_text: `Raspunde cu stop sau foloseste ${optOutBase}${target.leadId}`
      })
      .select("id")
      .single();
    if (messageInsert.error) throw messageInsert.error;
    const messageId = (messageInsert.data as { id: string }).id;

    try {
      const sendResult = await sendOutreachMailboxEmail({
        to: [target.email],
        subject: email.followUpSubject,
        text: email.followUpText,
        html: email.followUpHtml
      });
      await admin
        .from("outreach_messages")
        .update({
          status: "sent",
          provider_message_id: sendResult.messageId,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", messageId);
      await admin
        .from("outreach_followups")
        .update({ status: "sent", sent_message_id: messageId, updated_at: new Date().toISOString() })
        .eq("id", followUp.id);
      sent += 1;
    } catch (error) {
      failed += 1;
      await admin
        .from("outreach_messages")
        .update({ status: "failed", failed_at: new Date().toISOString(), last_error: error instanceof Error ? error.message : String(error) })
        .eq("id", messageId);
    }
  }

  for (const target of initialTargets.slice(0, Math.max(0, capacity - sent))) {
    const email = generatePersonalizedOutreach({
      nicheSlug: snapshot.niche.slug,
      businessName: target.businessName,
      city: target.city,
      website: target.website ?? undefined,
      observableSignals: {
        bookingLinkDetected: Boolean(target.observableSignals.bookingLinkDetected),
        instagramDetected: Boolean(target.observableSignals.instagramDetected),
        hasServiceMenu: Boolean(target.observableSignals.hasServiceMenu)
      },
      optOutUrl: `${optOutBase}${target.leadId}`,
      senderName
    });

    previews.push({ to: target.email, subject: email.subject });

    if (input?.dryRun) {
      continue;
    }

    const messageInsert = await admin
      .from("outreach_messages")
      .insert({
        campaign_id: campaign.id,
        batch_id: batchId,
        lead_id: target.leadId,
        lead_contact_id: target.contactId,
        message_kind: "initial",
        status: "queued",
        subject: email.subject,
        body_text: email.text,
        body_html: email.html,
        personalization_payload: {
          businessName: target.businessName,
          city: target.city,
          website: target.website
        },
        opt_out_text: `Raspunde cu stop sau foloseste ${optOutBase}${target.leadId}`
      })
      .select("id")
      .single();
    if (messageInsert.error) throw messageInsert.error;

    const messageId = (messageInsert.data as { id: string }).id;

    try {
      const sendResult = await sendOutreachMailboxEmail({
        to: [target.email],
        subject: email.subject,
        text: email.text,
        html: email.html
      });

      await admin
        .from("outreach_messages")
        .update({
          status: "sent",
          provider_message_id: sendResult.messageId,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", messageId);
      await admin
        .from("leads")
        .update({ qualification_status: "contacted", last_contacted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", target.leadId);
      await admin.from("outreach_followups").insert({
        campaign_id: campaign.id,
        lead_id: target.leadId,
        initial_message_id: messageId,
        status: "scheduled",
        due_at: new Date(Date.now() + limits.followUpDelayDays * 24 * 60 * 60 * 1000).toISOString()
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      await admin
        .from("outreach_messages")
        .update({ status: "failed", failed_at: new Date().toISOString(), last_error: error instanceof Error ? error.message : String(error) })
        .eq("id", messageId);
    }
  }

  if (!input?.dryRun) {
    await admin
      .from("outreach_batches")
      .update({
        status: failed > 0 && sent === 0 ? "failed" : "completed",
        sent_message_count: sent,
        failed_message_count: failed,
        completed_at: new Date().toISOString()
      })
      .eq("id", batchId);
  }

  const counters = await syncZoneCountersFromData(snapshot.zone.id);
  const replies = await listRecentReplyEvents(5);
  const exhaustion = evaluateZoneExhaustion({
    scrapingCompleted: snapshot.zone.scraping_completed,
    scrapeRunsCount: 3,
    latestNewValidLeads: snapshot.zone.last_scrape_new_valid_leads,
    previousNewValidLeads: 0,
    rerunHistory: [],
    remainingContactableLeads: counters.remaining,
    uncontactableLeads: counters.uncontactable,
    duplicateLeads: snapshot.zone.duplicate_leads_count,
    alreadyContactedLeads: counters.alreadyContacted,
    suppressedLeads: counters.suppressed,
    lowYieldRunsCount: snapshot.zone.last_scrape_new_valid_leads <= 3 ? 1 : 0,
    usefulYieldRate: snapshot.zone.discovered_leads_count > 0 ? snapshot.zone.last_scrape_new_valid_leads / snapshot.zone.discovered_leads_count : 0,
    confirmationRunsWithoutUsefulVolume: snapshot.zone.last_scrape_new_valid_leads <= 1 ? 1 : 0
  });

  await admin
    .from("coverage_zones")
    .update({
      exhaustion_score: exhaustion.score,
      exhaustion_stage: exhaustion.stage,
      exhaustion_reason: exhaustion.reasons.join(" "),
      updated_at: new Date().toISOString()
    })
    .eq("id", snapshot.zone.id);

  if (exhaustion.shouldMarkExhausted && snapshot.zone.status === "sending") {
    await transitionCoverageZoneStatus({
      zoneId: snapshot.zone.id,
      toStatus: "exhausted",
      reason: exhaustion.reasons.join(" "),
      changedByType: "cron"
    });
  }

  return {
    ok: true,
    sent,
    failed,
    replies: replies.length,
    exhaustion,
    previews,
    counts
  };
}