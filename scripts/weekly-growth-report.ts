import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

type NumericArg = number | null;

type AuthUser = {
  id: string;
  email?: string | null;
  created_at: string;
  email_confirmed_at?: string | null;
};

type ProfessionalRow = {
  id: string;
  created_at: string;
  onboarding_completed_at?: string | null;
  onboarding_pas?: number | null;
};

type BookingRow = {
  id: string;
  created_at: string;
};

type OperationalEventRow = {
  created_at: string;
};

type RangeCounts = {
  signupsReal: number;
  professionalsCreated: number;
  onboardingCompleted: number;
  bookingCreated: number;
  onboardingActivations: number;
};

function parseNumericArg(flag: string): NumericArg {
  const index = process.argv.findIndex((arg) => arg === flag);
  if (index === -1) return null;
  const raw = process.argv[index + 1];
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInternalEmails(): Set<string> {
  const envValue = process.env.WEEKLY_INTERNAL_EMAILS?.trim() ?? "";
  if (!envValue) return new Set();
  return new Set(
    envValue
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

function looksLikeTestEmail(email: string): boolean {
  return /demo|test|qa|fake|sample|dummy|asdf|mailinator|tempmail|example\.com/.test(email.toLowerCase());
}

function isRealSignup(user: AuthUser, internalEmails: Set<string>): boolean {
  const email = (user.email ?? "").trim().toLowerCase();
  if (!email) return false;
  if (looksLikeTestEmail(email)) return false;
  if (internalEmails.has(email)) return false;
  return true;
}

function inRange(timestamp: string, start: Date, end: Date): boolean {
  const time = new Date(timestamp).getTime();
  return time >= start.getTime() && time < end.getTime();
}

function countInRange<T extends { created_at: string }>(rows: T[], start: Date, end: Date): number {
  return rows.filter((row) => inRange(row.created_at, start, end)).length;
}

function onboardingCompletedAt(row: ProfessionalRow): string | null {
  if (row.onboarding_completed_at) return row.onboarding_completed_at;
  if ((row.onboarding_pas ?? 0) >= 4) return row.created_at;
  return null;
}

function countOnboardingCompleted(rows: ProfessionalRow[], start: Date, end: Date): number {
  return rows.filter((row) => {
    const completedAt = onboardingCompletedAt(row);
    return completedAt && inRange(completedAt, start, end);
  }).length;
}

function deltaPercent(current: number, previous: number): string {
  if (previous === 0) {
    return current === 0 ? "0.0%" : "n/a";
  }
  const value = ((current - previous) / previous) * 100;
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function buildRangeCounts(
  realUsers: AuthUser[],
  professionals: ProfessionalRow[],
  bookings: BookingRow[],
  activations: OperationalEventRow[],
  start: Date,
  end: Date
): RangeCounts {
  return {
    signupsReal: countInRange(realUsers, start, end),
    professionalsCreated: countInRange(professionals, start, end),
    onboardingCompleted: countOnboardingCompleted(professionals, start, end),
    bookingCreated: countInRange(bookings, start, end),
    onboardingActivations: countInRange(activations, start, end)
  };
}

function markdownTableLine(metric: string, current: number, previous: number): string {
  return `| ${metric} | ${current} | ${previous} | ${deltaPercent(current, previous)} |`;
}

async function run() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const indexedPages = parseNumericArg("--indexed-pages");
  const impressions = parseNumericArg("--impressions");
  const clicks = parseNumericArg("--clicks");
  const internalEmails = parseInternalEmails();

  const now = new Date();
  const currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previousStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    authUsersResult,
    professionalsResult,
    bookingsResult,
    activationsResult
  ] = await Promise.all([
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase
      .from("profesionisti")
      .select("id, created_at, onboarding_completed_at, onboarding_pas")
      .gte("created_at", previousStart.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("programari")
      .select("id, created_at")
      .gte("created_at", previousStart.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("operational_events")
      .select("created_at")
      .eq("event_type", "onboarding_activation")
      .gte("created_at", previousStart.toISOString())
      .order("created_at", { ascending: false })
  ]);

  if (authUsersResult.error) {
    console.error(`auth users query failed: ${authUsersResult.error.message}`);
    process.exit(1);
  }
  if (professionalsResult.error) {
    console.error(`profesionisti query failed: ${professionalsResult.error.message}`);
    process.exit(1);
  }
  if (bookingsResult.error) {
    console.error(`programari query failed: ${bookingsResult.error.message}`);
    process.exit(1);
  }
  if (activationsResult.error) {
    console.error(`operational_events query failed: ${activationsResult.error.message}`);
    process.exit(1);
  }

  const authUsers = (authUsersResult.data.users as AuthUser[]).filter((user) => isRealSignup(user, internalEmails));
  const professionals = (professionalsResult.data ?? []) as ProfessionalRow[];
  const bookings = (bookingsResult.data ?? []) as BookingRow[];
  const activations = (activationsResult.data ?? []) as OperationalEventRow[];

  const current = buildRangeCounts(authUsers, professionals, bookings, activations, currentStart, now);
  const previous = buildRangeCounts(authUsers, professionals, bookings, activations, previousStart, currentStart);

  const reportDate = now.toISOString().slice(0, 10);
  const periodLabel = `${currentStart.toISOString().slice(0, 10)} to ${reportDate}`;
  const previousLabel = `${previousStart.toISOString().slice(0, 10)} to ${currentStart.toISOString().slice(0, 10)}`;

  const lines = [
    `Weekly growth report (${periodLabel})`,
    "",
    `Compared against previous week (${previousLabel})`,
    "",
    "Metric | Current week | Previous week | WoW",
    "--- | ---: | ---: | ---:",
    markdownTableLine("Real signups (auth.users)", current.signupsReal, previous.signupsReal),
    markdownTableLine("Professionals created", current.professionalsCreated, previous.professionalsCreated),
    markdownTableLine("Onboarding completed", current.onboardingCompleted, previous.onboardingCompleted),
    markdownTableLine("Onboarding activations (events)", current.onboardingActivations, previous.onboardingActivations),
    markdownTableLine("Bookings created", current.bookingCreated, previous.bookingCreated),
    "",
    "Search Console metrics (manual input)",
    `- Indexed pages: ${indexedPages ?? "missing (use --indexed-pages)"}`,
    `- Impressions: ${impressions ?? "missing (use --impressions)"}`,
    `- Clicks: ${clicks ?? "missing (use --clicks)"}`,
    "",
    "Notes",
    "- Real signups exclude test-like emails and addresses listed in WEEKLY_INTERNAL_EMAILS.",
    "- Run this script weekly and commit/export reports/weekly-growth-latest.md."
  ];

  const markdown = [
    `# Weekly Growth Report - ${reportDate}`,
    "",
    `Period: ${periodLabel}`,
    `Comparison: ${previousLabel}`,
    "",
    "| Metric | Current week | Previous week | WoW |",
    "| --- | ---: | ---: | ---: |",
    `| Real signups (auth.users) | ${current.signupsReal} | ${previous.signupsReal} | ${deltaPercent(current.signupsReal, previous.signupsReal)} |`,
    `| Professionals created | ${current.professionalsCreated} | ${previous.professionalsCreated} | ${deltaPercent(current.professionalsCreated, previous.professionalsCreated)} |`,
    `| Onboarding completed | ${current.onboardingCompleted} | ${previous.onboardingCompleted} | ${deltaPercent(current.onboardingCompleted, previous.onboardingCompleted)} |`,
    `| Onboarding activations (events) | ${current.onboardingActivations} | ${previous.onboardingActivations} | ${deltaPercent(current.onboardingActivations, previous.onboardingActivations)} |`,
    `| Bookings created | ${current.bookingCreated} | ${previous.bookingCreated} | ${deltaPercent(current.bookingCreated, previous.bookingCreated)} |`,
    "",
    "## Search Console (manual weekly copy)",
    `- Indexed pages: ${indexedPages ?? "missing (pass --indexed-pages N)"}`,
    `- Impressions: ${impressions ?? "missing (pass --impressions N)"}`,
    `- Clicks: ${clicks ?? "missing (pass --clicks N)"}`,
    "",
    "## Rules",
    "- Keep WEEKLY_INTERNAL_EMAILS set with internal addresses (comma separated).",
    "- Real signups exclude test-like email patterns automatically."
  ].join("\n");

  const reportPath = path.join(process.cwd(), "reports", "weekly-growth-latest.md");
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${markdown}\n`, "utf8");

  console.log(lines.join("\n"));
  console.log(`\nSaved markdown report: ${reportPath}`);
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`weekly-growth-report failed: ${message}`);
  process.exit(1);
});
