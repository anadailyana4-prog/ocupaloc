import { normalizeEmailCandidate } from "@/lib/outreach/email-filter";
import { transitionCoverageZoneStatus } from "@/lib/outreach/coverage-service";
import { computeCommercialScore } from "@/lib/outreach/commercial-scoring";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

function normalizeWebsite(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return url.toString().toLowerCase();
  } catch {
    return null;
  }
}

function normalizePhone(raw: string | null | undefined) {
  if (!raw) return null;
  const normalized = raw.replace(/\D+/g, "");
  return normalized.length >= 7 ? normalized : null;
}

function scoreLead(input: { hasEmail: boolean; hasWebsite: boolean; hasPhone: boolean; category: string | null }) {
  let score = 0;
  if (input.hasEmail) score += 45;
  if (input.hasWebsite) score += 25;
  if (input.hasPhone) score += 15;
  if ((input.category ?? "").trim().length > 0) score += 15;
  return score;
}

export async function runQualificationPipeline(input?: { zoneId?: string }) {
  const admin = createSupabaseServiceClient();
  const zoneResult = input?.zoneId
    ? await admin.from("coverage_zones").select("id, status").eq("id", input.zoneId).single()
    : await admin.from("coverage_zones").select("id, status").eq("is_active", true).limit(1).single();

  if (zoneResult.error) {
    throw zoneResult.error;
  }

  const zone = zoneResult.data as { id: string; status: string };
  if (zone.status === "scraping") {
    await transitionCoverageZoneStatus({
      zoneId: zone.id,
      toStatus: "qualifying",
      reason: "Calificarea porneste dupa scraping",
      changedByType: "cron"
    });
  }

  const leadsResult = await admin
    .from("leads")
    .select("id, business_name, website, primary_phone, category, qualification_status, observable_signals, commercial_category, commercial_score")
    .eq("coverage_zone_id", zone.id)
    .in("qualification_status", ["raw", "review"]);

  if (leadsResult.error) {
    throw leadsResult.error;
  }

  const leadIds = (leadsResult.data ?? []).map((row) => (row as { id: string }).id);
  const contactsResult = leadIds.length
    ? await admin.from("lead_contacts").select("lead_id, channel, normalized_value, is_valid").in("lead_id", leadIds)
    : { data: [], error: null };
  if (contactsResult.error) {
    throw contactsResult.error;
  }

  const suppressionResult = await admin.from("suppression_list").select("normalized_value, channel");
  if (suppressionResult.error) {
    throw suppressionResult.error;
  }

  const sentMessagesResult = leadIds.length
    ? await admin.from("outreach_messages").select("lead_id, status").in("lead_id", leadIds)
    : { data: [], error: null };
  if (sentMessagesResult.error) {
    throw sentMessagesResult.error;
  }

  const suppressedEmails = new Set<string>();
  const suppressedPhones = new Set<string>();
  const suppressedWebsites = new Set<string>();
  for (const row of suppressionResult.data ?? []) {
    const value = (row as { normalized_value: string }).normalized_value;
    const channel = (row as { channel: "email" | "phone" | "website" }).channel;
    if (channel === "email") suppressedEmails.add(value);
    if (channel === "phone") suppressedPhones.add(value);
    if (channel === "website") suppressedWebsites.add(value);
  }
  const messageMap = new Map<string, string[]>();
  for (const row of sentMessagesResult.data ?? []) {
    const entry = row as { lead_id: string; status: string };
    messageMap.set(entry.lead_id, [...(messageMap.get(entry.lead_id) ?? []), entry.status]);
  }

  const contactMap = new Map<string, Array<{ channel: string; normalized_value: string; is_valid: boolean }>>();
  for (const row of contactsResult.data ?? []) {
    const contact = row as { lead_id: string; channel: string; normalized_value: string; is_valid: boolean };
    contactMap.set(contact.lead_id, [...(contactMap.get(contact.lead_id) ?? []), contact]);
  }

  let qualified = 0;
  let review = 0;
  let rejected = 0;
  let suppressed = 0;
  let contacted = 0;

  for (const row of leadsResult.data ?? []) {
    const lead = row as {
      id: string;
      business_name: string;
      website: string | null;
      primary_phone: string | null;
      category: string | null;
      qualification_status: string;
      observable_signals: Record<string, unknown> | null;
    };
    const contacts = contactMap.get(lead.id) ?? [];
    const hasEmail = contacts.some((contact) => contact.channel === "email" && contact.is_valid);
    const hasWebsite = Boolean(normalizeWebsite(lead.website)) || contacts.some((contact) => contact.channel === "website" && contact.is_valid);
    const hasPhone = Boolean(lead.primary_phone) || contacts.some((contact) => contact.channel === "phone" && contact.is_valid);
    const emailCandidates = contacts
      .filter((contact) => contact.channel === "email")
      .map((contact) => normalizeEmailCandidate(contact.normalized_value))
      .filter((value): value is string => Boolean(value));
    const phoneCandidates = contacts
      .filter((contact) => contact.channel === "phone")
      .map((contact) => normalizePhone(contact.normalized_value))
      .filter((value): value is string => Boolean(value));
    const websiteCandidates = contacts
      .filter((contact) => contact.channel === "website")
      .map((contact) => normalizeWebsite(contact.normalized_value))
      .filter((value): value is string => Boolean(value));
    const leadPhone = normalizePhone(lead.primary_phone);
    const leadWebsite = normalizeWebsite(lead.website);

    const isSuppressed =
      emailCandidates.some((value) => suppressedEmails.has(value)) ||
      phoneCandidates.some((value) => suppressedPhones.has(value)) ||
      websiteCandidates.some((value) => suppressedWebsites.has(value)) ||
      (leadPhone ? suppressedPhones.has(leadPhone) : false) ||
      (leadWebsite ? suppressedWebsites.has(leadWebsite) : false);
    const alreadySent = (messageMap.get(lead.id) ?? []).some((status) => ["sent", "replied", "bounced"].includes(status));

    let nextStatus = "review";
    let reason = "Lead-ul necesita verificare manuala.";
    const score = scoreLead({ hasEmail, hasWebsite, hasPhone, category: lead.category });

    if (isSuppressed) {
      nextStatus = "suppressed";
      reason = "Lead-ul exista in suppression list.";
      suppressed += 1;
    } else if (alreadySent) {
      nextStatus = "contacted";
      reason = "Lead-ul a fost deja contactat in campanie.";
      contacted += 1;
    } else if (!hasEmail && !hasWebsite && !hasPhone) {
      nextStatus = "rejected";
      reason = "Lead fara date minime de contact utile.";
      rejected += 1;
    } else if (score >= 60 && hasEmail) {
      nextStatus = "qualified";
      reason = "Lead relevant cu email utilizabil pentru outreach.";
      qualified += 1;
    } else if (score >= 40) {
      nextStatus = "review";
      reason = "Lead util, dar cu date incomplete pentru trimitere imediata.";
      review += 1;
    } else {
      nextStatus = "rejected";
      reason = "Lead cu relevanta sau date prea slabe.";
      rejected += 1;
    }

    const signals = (lead.observable_signals ?? {}) as Record<string, unknown>;
    const commercial = computeCommercialScore({
      hasEmail,
      hasPhone,
      hasWebsite,
      reviewCount: typeof signals["review_count"] === "number" ? signals["review_count"] as number : null,
      reviewScore: typeof signals["review_score"] === "number" ? signals["review_score"] as number : null,
      category: lead.category,
      businessName: lead.business_name,
      locality: null,
      observableSignals: signals
    });

    const update = await admin
      .from("leads")
      .update({
        qualification_status: nextStatus,
        qualification_reason: reason,
        source_quality: Number((score / 100).toFixed(2)),
        commercial_category: commercial.category,
        commercial_score: commercial.score,
        updated_at: new Date().toISOString()
      })
      .eq("id", lead.id);

    if (update.error) {
      throw update.error;
    }

    const logInsert = await admin.from("lead_qualification_logs").insert({
      lead_id: lead.id,
      previous_status: lead.qualification_status,
      next_status: nextStatus,
      reason,
      quality_score: Number((score / 100).toFixed(2)),
      details: {
        hasEmail,
        hasWebsite,
        hasPhone,
        businessName: lead.business_name,
        normalizedEmail: contacts.find((contact) => contact.channel === "email")?.normalized_value ?? null,
        normalizedPhone: lead.primary_phone ?? null,
        normalizedWebsite: normalizeWebsite(lead.website)
      }
    });

    if (logInsert.error) {
      throw logInsert.error;
    }
  }

  await admin
    .from("coverage_zones")
    .update({
      qualified_leads_count: qualified,
      remaining_leads_count: qualified,
      uncontactable_leads_count: rejected,
      suppressed_leads_count: suppressed,
      already_contacted_leads_count: contacted,
      updated_at: new Date().toISOString()
    })
    .eq("id", zone.id);

  await transitionCoverageZoneStatus({
    zoneId: zone.id,
    toStatus: "ready",
    reason: "Calificarea s-a incheiat, zona este gata pentru batch-uri controlate",
    changedByType: "cron"
  });

  return { zoneId: zone.id, qualified, review, rejected, suppressed, contacted };
}