import { normalizeEmailCandidate } from "@/lib/outreach/email-filter";
import { scrapeFreeLeads } from "@/lib/outreach/free-scraper";
import { transitionCoverageZoneStatus } from "@/lib/outreach/coverage-service";
import { DEFAULT_OUTREACH_HEALTH_THRESHOLDS } from "@/lib/outreach/ops-constants";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

function escapePostgrestValue(value: string) {
  return value.replace(/"/g, '""');
}

function normalizePhone(raw: string | null | undefined) {
  return raw ? raw.replace(/[^+\d]/g, "") : null;
}

function normalizeWebsite(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return url.toString().toLowerCase();
  } catch {
    return null;
  }
}

async function notifyTelegramAdmins(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  const admin = createSupabaseServiceClient();
  const adminsResult = await admin.from("telegram_admins").select("chat_id").eq("is_active", true);
  if (adminsResult.error) {
    throw adminsResult.error;
  }

  await Promise.all((adminsResult.data ?? []).map(async (row) => {
    const chatId = Number((row as { chat_id: number }).chat_id);
    if (!Number.isFinite(chatId)) return;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  }));
}

function getHealthThresholds() {
  return {
    lowYieldMinInsertedLeads: Number(process.env.OUTREACH_LOW_YIELD_MIN_INSERTED_LEADS ?? DEFAULT_OUTREACH_HEALTH_THRESHOLDS.lowYieldMinInsertedLeads)
  };
}

function matchesNiche(nicheSlug: string, input: { businessName: string; category: string | null }) {
  const haystack = `${input.businessName} ${input.category ?? ""}`.toLowerCase();
  switch (nicheSlug) {
    case "barber":
      return (
        haystack.includes("barber")
        || haystack.includes("frizer")
        || haystack.includes("hairdresser")
        || haystack.includes("coafor")
      );
    case "frizerii":
      return haystack.includes("frizer") || haystack.includes("hairdresser") || haystack.includes("coafor");
    case "saloane":
      return haystack.includes("salon") || haystack.includes("beauty") || haystack.includes("cosmetic");
    case "clinici-estetice":
      return haystack.includes("clin") || haystack.includes("estetic") || haystack.includes("aesthetic");
    default:
      return true;
  }
}

async function getZoneLocalities(zoneId: string) {
  const admin = createSupabaseServiceClient();
  const localitiesResult = await admin
    .from("coverage_zone_localities")
    .select("city_id, commune_id, locality_type, execution_order")
    .eq("coverage_zone_id", zoneId)
    .order("execution_order", { ascending: true });

  if (localitiesResult.error) {
    throw localitiesResult.error;
  }

  const cityIds = (localitiesResult.data ?? [])
    .map((row) => (row as { city_id: string | null }).city_id)
    .filter((value): value is string => Boolean(value));
  const communeIds = (localitiesResult.data ?? [])
    .map((row) => (row as { commune_id: string | null }).commune_id)
    .filter((value): value is string => Boolean(value));

  const cityMap = new Map<string, string>();
  const communeMap = new Map<string, string>();

  if (cityIds.length > 0) {
    const citiesResult = await admin.from("cities").select("id, name").in("id", cityIds);
    if (citiesResult.error) throw citiesResult.error;
    for (const row of citiesResult.data ?? []) {
      const city = row as { id: string; name: string };
      cityMap.set(city.id, city.name);
    }
  }

  if (communeIds.length > 0) {
    const communesResult = await admin.from("communes").select("id, name").in("id", communeIds);
    if (communesResult.error) throw communesResult.error;
    for (const row of communesResult.data ?? []) {
      const commune = row as { id: string; name: string };
      communeMap.set(commune.id, commune.name);
    }
  }

  return (localitiesResult.data ?? []).map((row) => {
    const locality = row as {
      city_id: string | null;
      commune_id: string | null;
      locality_type: "city" | "commune";
    };
    return {
      name:
        locality.locality_type === "city"
          ? cityMap.get(locality.city_id ?? "") ?? ""
          : communeMap.get(locality.commune_id ?? "") ?? "",
      localityType: locality.locality_type
    };
  });
}

export async function runScraperOrchestration(input?: { zoneId?: string; limitPerLocality?: number }) {
  const admin = createSupabaseServiceClient();
  const zoneResult = input?.zoneId
    ? await admin.from("coverage_zones").select("id, niche_id, status, rerun_history, scrape_runs_count").eq("id", input.zoneId).single()
    : await admin.from("coverage_zones").select("id, niche_id, status, rerun_history, scrape_runs_count").eq("is_active", true).limit(1).single();

  if (zoneResult.error) {
    throw zoneResult.error;
  }

  const zone = zoneResult.data as {
    id: string;
    niche_id: string;
    status: string;
    rerun_history: number[] | null;
    scrape_runs_count: number;
  };

  if (zone.status === "planned") {
    await transitionCoverageZoneStatus({
      zoneId: zone.id,
      toStatus: "scraping",
      reason: "Pornire orchestrare scraper pentru zona activa",
      changedByType: "cron"
    });
  }

  const nicheResult = await admin.from("niches").select("slug").eq("id", zone.niche_id).single();
  if (nicheResult.error) {
    throw nicheResult.error;
  }

  const nicheSlug = (nicheResult.data as { slug: string }).slug;
  const localities = await getZoneLocalities(zone.id);
  // No default cap: scrape all available candidates unless an explicit test cap is provided.
  const limitPerLocality = input?.limitPerLocality;
  const seen = new Set<string>();
  const scrapeIssues: string[] = [];

  let discovered = 0;
  let inserted = 0;

  for (const locality of localities) {
    if (!locality.name) continue;

    let candidates;
    try {
      candidates = await scrapeFreeLeads({ city: locality.name, limit: limitPerLocality });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown scraping error";
      scrapeIssues.push(`${locality.name}: ${message}`);
      continue;
    }

    for (const candidate of candidates) {
      if (!matchesNiche(nicheSlug, { businessName: candidate.businessName, category: candidate.category })) {
        continue;
      }

      const normalizedPhone = normalizePhone(candidate.phone);
      const normalizedWebsite = normalizeWebsite(candidate.website);
      const normalizedGoogleMapsUrl = candidate.googleMapsUrl?.trim().toLowerCase() ?? null;
      const dedupeKey = `${candidate.businessName.toLowerCase()}|${normalizedPhone ?? ""}|${normalizedWebsite ?? ""}|${normalizedGoogleMapsUrl ?? ""}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);
      discovered += 1;

      const nameFilter = `business_name.eq."${escapePostgrestValue(candidate.businessName)}"`;
      const websiteFilter = normalizedWebsite ? `website.eq."${escapePostgrestValue(normalizedWebsite)}"` : null;
      const phoneFilter = normalizedPhone ? `primary_phone.eq."${escapePostgrestValue(normalizedPhone)}"` : null;
      const mapsFilter = normalizedGoogleMapsUrl ? `google_maps_url.eq."${escapePostgrestValue(normalizedGoogleMapsUrl)}"` : null;
      const existingLead = await admin
        .from("leads")
        .select("id")
        .eq("coverage_zone_id", zone.id)
        .or([nameFilter, websiteFilter, phoneFilter, mapsFilter].filter(Boolean).join(","))
        .limit(1)
        .maybeSingle();

      if (existingLead.error) {
        throw existingLead.error;
      }

      if (existingLead.data) {
        continue;
      }

      const leadInsert = await admin
        .from("leads")
        .insert({
          niche_id: zone.niche_id,
          coverage_zone_id: zone.id,
          business_name: candidate.businessName,
          website: normalizeWebsite(candidate.website),
          google_maps_url: candidate.googleMapsUrl,
          primary_phone: normalizePhone(candidate.phone),
          category: candidate.category,
          source_quality: candidate.email ? 0.9 : candidate.website ? 0.7 : 0.5,
          observable_signals: {
            hasWebsite: Boolean(candidate.website),
            hasPhone: Boolean(candidate.phone),
            sourceLocality: locality.name
          }
        })
        .select("id")
        .single();

      if (leadInsert.error) {
        throw leadInsert.error;
      }

      const leadId = (leadInsert.data as { id: string }).id;
      inserted += 1;

      const contacts = [
        candidate.email
          ? {
              channel: "email",
              value: candidate.email,
              normalized_value: normalizeEmailCandidate(candidate.email) ?? candidate.email.toLowerCase(),
              is_primary: true
            }
          : null,
        candidate.phone
          ? {
              channel: "phone",
              value: candidate.phone,
              normalized_value: normalizePhone(candidate.phone) ?? candidate.phone,
              is_primary: !candidate.email
            }
          : null,
        candidate.website
          ? {
              channel: "website",
              value: candidate.website,
              normalized_value: normalizeWebsite(candidate.website) ?? candidate.website.toLowerCase(),
              is_primary: false
            }
          : null
      ].filter(Boolean) as Array<{ channel: string; value: string; normalized_value: string; is_primary: boolean }>;

      if (contacts.length > 0) {
        const contactInsert = await admin.from("lead_contacts").insert(
          contacts.map((contact) => ({
            lead_id: leadId,
            channel: contact.channel,
            value: contact.value,
            normalized_value: contact.normalized_value,
            is_primary: contact.is_primary,
            source: "free_scraper"
          }))
        );
        if (contactInsert.error) {
          throw contactInsert.error;
        }
      }

      const sourceInsert = await admin.from("lead_sources").insert({
        lead_id: leadId,
        source_type: "free_scraper",
        source_payload: {
          locality: locality.name,
          localityType: locality.localityType,
          category: candidate.category,
          googleMapsUrl: candidate.googleMapsUrl
        }
      });

      if (sourceInsert.error) {
        throw sourceInsert.error;
      }
    }
  }

  const rerunHistory = [...(zone.rerun_history ?? []), inserted].slice(-5);
  const update = await admin
    .from("coverage_zones")
    .update({
      scrape_runs_count: zone.scrape_runs_count + 1,
      last_scrape_new_leads: discovered,
      last_scrape_new_valid_leads: inserted,
      rerun_history: rerunHistory,
      scraping_completed: true,
      last_scrape_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", zone.id);

  if (update.error) {
    throw update.error;
  }

  if (inserted < getHealthThresholds().lowYieldMinInsertedLeads) {
    await notifyTelegramAdmins([
      "⚠️ Scrape cu yield mic",
      `Zona: ${zone.id}`,
      `Nisa: ${nicheSlug}`,
      `Lead-uri noi descoperite: ${discovered}`,
      `Lead-uri inserate: ${inserted}`,
      "Recomandare: re-scrape, extindere pe localitati vecine sau trecere la urmatoarea zona."
    ].join("\n"));
  }

  if (scrapeIssues.length > 0) {
    const shownIssues = scrapeIssues.slice(0, 5);
    const omitted = scrapeIssues.length - shownIssues.length;
    await notifyTelegramAdmins([
      "⚠️ Unele localitati nu au putut fi procesate",
      `Zona: ${zone.id}`,
      `Nisa: ${nicheSlug}`,
      `Localitati esuate: ${scrapeIssues.length}/${localities.length}`,
      ...shownIssues,
      omitted > 0 ? `...si inca ${omitted} localitati.` : null
    ].filter(Boolean).join("\n"));
  }

  const zoneAfterScrape = await admin.from("coverage_zones").select("status").eq("id", zone.id).single();
  if (zoneAfterScrape.error) {
    throw zoneAfterScrape.error;
  }

  if ((zoneAfterScrape.data as { status: string }).status === "scraping") {
    await transitionCoverageZoneStatus({
      zoneId: zone.id,
      toStatus: "qualifying",
      reason: "Scraping complet, trecere in etapa de calificare",
      changedByType: "cron"
    });
  }

  return {
    zoneId: zone.id,
    localitiesProcessed: localities.length,
    discovered,
    inserted,
    rerunHistory
  };
}