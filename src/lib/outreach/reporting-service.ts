import { getCoverageSnapshot, getOperationalSnapshot } from "@/lib/outreach/coverage-service";
import { listRecentReplyEvents } from "@/lib/outreach/reply-events";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

function formatRate(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

async function upsertReport(input: {
  reportType: "operational" | "coverage" | "efficiency" | "handoff";
  nicheId?: string;
  coverageZoneId?: string;
  title: string;
  body: string;
  metrics: Record<string, unknown>;
}) {
  const admin = createSupabaseServiceClient();
  const result = await admin.from("daily_reports").upsert(
    {
      report_date: new Date().toISOString().slice(0, 10),
      niche_id: input.nicheId ?? null,
      coverage_zone_id: input.coverageZoneId ?? null,
      report_type: input.reportType,
      title: input.title,
      body: input.body,
      metrics: input.metrics,
      created_at: new Date().toISOString()
    },
    { onConflict: "report_date,report_type,niche_id,coverage_zone_id" }
  );

  if (result.error) {
    throw result.error;
  }
}

export async function buildDailyReports() {
  const snapshot = await getOperationalSnapshot();
  const coverage = await getCoverageSnapshot();
  const replies = await listRecentReplyEvents(5);
  const admin = createSupabaseServiceClient();

  if (!snapshot) {
    return {
      operational: "Nu exista inca o nisa si o zona activa configurata.",
      coverage: "Coverage-ul nu este configurat complet.",
      efficiency: "Nu exista date de eficienta pentru raport.",
      handoff: "Nu exista o tranzitie de zona de raportat."
    };
  }

  const campaignResult = await admin
    .from("outreach_campaigns")
    .select("id")
    .eq("coverage_zone_id", snapshot.zone.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (campaignResult.error) {
    throw campaignResult.error;
  }

  const messagesResult = campaignResult.data
    ? await admin
        .from("outreach_messages")
        .select("status, message_kind")
        .eq("campaign_id", (campaignResult.data as { id: string }).id)
        .limit(1000)
    : { data: [], error: null };

  if (messagesResult.error) {
    throw messagesResult.error;
  }

  const sentCount = (messagesResult.data ?? []).filter((row) => (row as { status: string }).status === "sent").length;
  const followUpSentCount = (messagesResult.data ?? []).filter(
    (row) => (row as { status: string; message_kind: string }).status === "sent" && (row as { message_kind: string }).message_kind === "follow_up"
  ).length;
  const bounceCount = (messagesResult.data ?? []).filter((row) => (row as { status: string }).status === "bounced").length;
  const positiveReplyCount = replies.filter((row) => {
    const eventType = (row as { event_type: string }).event_type;
    return eventType === "positive_reply" || eventType === "booking_intent";
  }).length;

  const replyRate = sentCount > 0 ? replies.length / sentCount : 0;
  const positiveReplyRate = sentCount > 0 ? positiveReplyCount / sentCount : 0;
  const bounceRate = sentCount > 0 ? bounceCount / sentCount : 0;
  const followUpEffectiveness = followUpSentCount > 0 ? positiveReplyCount / followUpSentCount : 0;

  const operational = [
    `Raport operational zilnic`,
    `Nisa curenta: ${snapshot.niche.slug}`,
    `Zona curenta: ${snapshot.zone.display_name}`,
    `Lead-uri noi: ${snapshot.zone.last_scrape_new_valid_leads}`,
    `Lead-uri calificate: ${snapshot.zone.qualified_leads_count}`,
    `Emailuri trimise: ${sentCount}`,
    `Follow-up-uri trimise: ${followUpSentCount}`,
    `Reply-uri noi: ${replies.length}`,
    `Bounce-uri: ${bounceCount}`,
    `Urmatorul batch: ${Math.min(10, snapshot.zone.remaining_leads_count)}`
  ].join("\n");

  const coverageReport = [
    `Raport de acoperire`,
    `Nisa activa: ${coverage.niche.slug}`,
    `Zone terminate: ${coverage.completed}`,
    `Zone in lucru: ${coverage.inWork}`,
    `Zone planificate: ${coverage.planned}`,
    `Progres national pe nisa: ${coverage.progressPercent}%`
  ].join("\n");

  const efficiencyReport = [
    `Raport de eficienta`,
    `Reply rate: ${formatRate(replyRate)}`,
    `Positive reply rate: ${formatRate(positiveReplyRate)}`,
    `Booking/demo intent: ${positiveReplyCount}`,
    `Bounce rate: ${formatRate(bounceRate)}`,
    `Follow-up effectiveness: ${formatRate(followUpEffectiveness)}`
  ].join("\n");

  const handoffReport = [
    `Raport de trecere`,
    `Zona curenta: ${snapshot.zone.display_name}`,
    `Status actual: ${snapshot.zone.status}`,
    `Scor epuizare: ${snapshot.zone.exhaustion_score}`,
    `Etapa epuizare: ${snapshot.zone.exhaustion_stage}`,
    `Urmatoarea zona propusa: ${snapshot.nextZone?.display_name ?? "Nicio alta zona in nisa curenta"}`,
    `Asteapta confirmare: ${snapshot.zone.exhaustion_stage === "exhausted_final" ? "da" : "nu"}`
  ].join("\n");

  await upsertReport({
    reportType: "operational",
    nicheId: snapshot.niche.id,
    coverageZoneId: snapshot.zone.id,
    title: "Raport operational zilnic",
    body: operational,
    metrics: {
      sentCount,
      followUpSentCount,
      replies: replies.length,
      bounceCount
    }
  });

  await upsertReport({
    reportType: "coverage",
    nicheId: snapshot.niche.id,
    coverageZoneId: snapshot.zone.id,
    title: "Raport de acoperire",
    body: coverageReport,
    metrics: {
      completed: coverage.completed,
      inWork: coverage.inWork,
      planned: coverage.planned,
      progressPercent: coverage.progressPercent
    }
  });

  await upsertReport({
    reportType: "efficiency",
    nicheId: snapshot.niche.id,
    coverageZoneId: snapshot.zone.id,
    title: "Raport de eficienta",
    body: efficiencyReport,
    metrics: {
      replyRate,
      positiveReplyRate,
      bounceRate,
      followUpEffectiveness
    }
  });

  await upsertReport({
    reportType: "handoff",
    nicheId: snapshot.niche.id,
    coverageZoneId: snapshot.zone.id,
    title: "Raport de trecere",
    body: handoffReport,
    metrics: {
      exhaustionScore: snapshot.zone.exhaustion_score,
      exhaustionStage: snapshot.zone.exhaustion_stage,
      nextZone: snapshot.nextZone?.display_name ?? null
    }
  });

  return {
    operational,
    coverage: coverageReport,
    efficiency: efficiencyReport,
    handoff: handoffReport
  };
}