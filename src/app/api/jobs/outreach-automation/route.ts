import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/config/env";
import { validateCronSecret } from "@/lib/cron-auth";
import { reportError } from "@/lib/observability";
import { runScraperOrchestration } from "@/lib/outreach/scraper-orchestrator";
import { runQualificationPipeline } from "@/lib/outreach/qualification-service";
import { buildDailyReports } from "@/lib/outreach/reporting-service";
import { syncLegacyRepliesToEvents } from "@/lib/outreach/reply-events";
import { runOutreachScheduler } from "@/lib/outreach/scheduler";
import { getOperationalSnapshot } from "@/lib/outreach/coverage-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = env.optional("OUTREACH_CRON_SECRET") ?? env.optional("CRON_SECRET");
  if (!validateCronSecret(request.headers, secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const action = request.nextUrl.searchParams.get("action") ?? "cycle";
  const forceStart = request.nextUrl.searchParams.get("forceStart") === "true";
  const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";

  try {
    if (action === "scrape") {
      return NextResponse.json({ ok: true, result: await runScraperOrchestration() });
    }

    if (action === "qualify") {
      return NextResponse.json({ ok: true, result: await runQualificationPipeline() });
    }

    if (action === "send") {
      return NextResponse.json({ ok: true, result: await runOutreachScheduler({ forceStart, dryRun }) });
    }

    if (action === "report") {
      return NextResponse.json({ ok: true, result: await buildDailyReports() });
    }

    if (action === "sync-replies") {
      return NextResponse.json({ ok: true, result: await syncLegacyRepliesToEvents(20) });
    }

    const snapshot = await getOperationalSnapshot();
    if (!snapshot) {
      return NextResponse.json({ ok: true, result: { reason: "Nu exista nisa/zona activa." } });
    }

    if (snapshot.zone.status === "planned" || snapshot.zone.status === "scraping") {
      return NextResponse.json({ ok: true, action: "scrape", result: await runScraperOrchestration({ zoneId: snapshot.zone.id }) });
    }

    if (snapshot.zone.status === "qualifying") {
      return NextResponse.json({ ok: true, action: "qualify", result: await runQualificationPipeline({ zoneId: snapshot.zone.id }) });
    }

    if (["ready", "sending", "cooldown"].includes(snapshot.zone.status)) {
      return NextResponse.json({ ok: true, action: "send", result: await runOutreachScheduler({ forceStart, dryRun }) });
    }

    if (snapshot.zone.status === "paused") {
      return NextResponse.json({ ok: true, action: "paused", result: { reason: "Zona este pe pauza." } });
    }

    return NextResponse.json({ ok: true, action: "idle", result: { reason: `Status curent: ${snapshot.zone.status}` } });
  } catch (error) {
    reportError("cron", "outreach_automation_failed", error, { action });
    return NextResponse.json({ ok: false, error: "Outreach automation failed" }, { status: 500 });
  }
}