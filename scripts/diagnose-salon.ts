/**
 * pnpm run diagnose:salon -- --slug=<slug>
 *
 * Founder-facing diagnostic tool. Answers in seconds why a given salon
 * cannot receive bookings, reminders, or billing.
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env (use .env.local).
 */
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

const slug = (() => {
  const arg = process.argv.find((a) => a.startsWith("--slug="));
  return arg?.split("=")[1]?.trim() ?? null;
})();

if (!slug) {
  console.error("Usage: pnpm run diagnose:salon -- --slug=<slug>");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Load .env.local first.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok(label: string, detail?: string) {
  process.stdout.write(`\x1b[32m✓\x1b[0m ${label}${detail ? `  (${detail})` : ""}\n`);
}
function warn(label: string, detail?: string) {
  process.stdout.write(`\x1b[33m⚠\x1b[0m ${label}${detail ? `  (${detail})` : ""}\n`);
}
function fail(label: string, detail?: string) {
  process.stdout.write(`\x1b[31m✗\x1b[0m ${label}${detail ? `  (${detail})` : ""}\n`);
}
function info(label: string, detail?: string) {
  process.stdout.write(`\x1b[36m→\x1b[0m ${label}${detail ? `  (${detail})` : ""}\n`);
}
function section(title: string) {
  process.stdout.write(`\n\x1b[1m${title}\x1b[0m\n${"─".repeat(50)}\n`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run() {
  console.log(`\nDiagnostic report for slug: \x1b[1m${slug}\x1b[0m\n${"═".repeat(50)}`);

  // ---- 1. Profesionist record ----
  section("1. Profesionist record");

  const { data: prof, error: profErr } = await supabase
    .from("profesionisti")
    .select("id, slug, email_contact, nome_business, onboarding_pas, program, created_at, user_id, notificari_email_nou")
    .eq("slug", slug)
    .maybeSingle();

  if (profErr || !prof) {
    fail("Profesionist not found for slug", profErr?.message ?? "no row");
    process.exit(1);
  }

  ok("Profesionist found", `id=${prof.id}`);
  info("Created at", String(prof.created_at).slice(0, 10));
  info("Onboarding step", String(prof.onboarding_pas ?? "unknown"));

  const onboardingDone = (prof.onboarding_pas ?? 0) >= 4;
  if (onboardingDone) ok("Onboarding complete");
  else warn("Onboarding NOT complete", `step=${prof.onboarding_pas}`);

  const emailContact = (prof.email_contact as string | null)?.trim();
  if (emailContact) ok("Owner email configured", emailContact);
  else warn("No owner email configured — won't receive new booking notifications or weekly summaries");

  // ---- 2. Servicii ----
  section("2. Services");

  const { data: servicii, count: serviciiCount } = await supabase
    .from("servicii")
    .select("id, nume, activ, durata_minute", { count: "exact" })
    .eq("profesionist_id", prof.id);

  const activeServices = (servicii ?? []).filter((s) => s.activ !== false);

  if ((serviciiCount ?? 0) === 0) {
    fail("No services found — booking page has nothing to book");
  } else if (activeServices.length === 0) {
    warn("Services exist but none are active", `total=${serviciiCount}`);
  } else {
    ok(`${activeServices.length} active services`, activeServices.map((s) => s.nume).join(", "));
  }

  // ---- 3. Schedule ----
  section("3. Schedule (program)");

  const programRaw = prof.program as Record<string, unknown> | null;
  if (!programRaw) {
    fail("No schedule configured — slots cannot be calculated");
  } else {
    const activeDays = Object.entries(programRaw).filter(
      ([, v]) => Array.isArray(v) && v.length === 2 && typeof v[0] === "string"
    );
    if (activeDays.length === 0) {
      warn("Schedule JSON exists but no working days set");
    } else {
      ok(`Schedule has ${activeDays.length} working days`, activeDays.map(([d]) => d).join(", "));
    }
  }

  // ---- 4. Bookings ----
  section("4. Recent and upcoming bookings");

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: recentBookings } = await supabase
    .from("programari")
    .select("id, data_start, status, nume_client")
    .eq("profesionist_id", prof.id)
    .gte("data_start", sevenDaysAgo.toISOString())
    .order("data_start", { ascending: false })
    .limit(5);

  const { count: upcomingCount } = await supabase
    .from("programari")
    .select("id", { count: "exact", head: true })
    .eq("profesionist_id", prof.id)
    .eq("status", "confirmat")
    .gte("data_start", now.toISOString())
    .lte("data_start", sevenDaysAhead.toISOString());

  const { count: totalBookings } = await supabase
    .from("programari")
    .select("id", { count: "exact", head: true })
    .eq("profesionist_id", prof.id);

  info("Total bookings (all time)", String(totalBookings ?? 0));
  info("Upcoming confirmed (7 days)", String(upcomingCount ?? 0));

  if ((recentBookings ?? []).length > 0) {
    ok("Recent bookings (last 7 days)");
    for (const b of recentBookings ?? []) {
      info(`  ${String(b.data_start).slice(0, 16)}  ${b.status}  ${b.nume_client}`);
    }
  } else {
    warn("No bookings in the last 7 days");
  }

  // ---- 5. Subscription / billing ----
  section("5. Subscription & billing");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, stripe_customer_id, stripe_subscription_id")
    .eq("profesionist_id", prof.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) {
    warn("No subscription record found — salon is on trial or has never subscribed");
  } else {
    info("Subscription status", sub.status);
    info("Period end", String(sub.current_period_end).slice(0, 10));
    info("Stripe customer", String(sub.stripe_customer_id));
    if (sub.status === "active" || sub.status === "trialing") {
      ok("Subscription is active");
    } else if (sub.status === "past_due") {
      fail("Subscription is past_due — billing failed, entitlement may be blocked soon");
    } else if (sub.status === "canceled") {
      fail("Subscription is canceled");
    } else {
      warn(`Subscription in state: ${sub.status}`);
    }
  }

  // ---- 6. Reminders ----
  section("6. Reminder system");

  const resendConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
  if (resendConfigured) ok("RESEND_API_KEY is set locally");
  else warn("RESEND_API_KEY not set in this environment (check production env)");

  const { count: remindersSent } = await supabase
    .from("programari_reminders")
    .select("id", { count: "exact", head: true })
    .eq("profesionist_id", prof.id);

  info("Total reminders sent (all time)", String(remindersSent ?? 0));

  const { count: remindersLast7d } = await supabase
    .from("programari_reminders")
    .select("id", { count: "exact", head: true })
    .eq("profesionist_id", prof.id)
    .gte("sent_at", sevenDaysAgo.toISOString());

  info("Reminders sent (last 7 days)", String(remindersLast7d ?? 0));

  if (prof.notificari_email_nou === false) {
    warn("Owner has disabled new booking notifications");
  } else {
    ok("Owner has new-booking email notifications enabled");
  }

  // ---- 7. Auth user ----
  section("7. Auth user");

  const { data: authUser } = await supabase.auth.admin.getUserById(prof.user_id as string);
  if (!authUser.user) {
    fail("Auth user not found for this salon");
  } else {
    ok("Auth user exists", authUser.user.email ?? "no email");
    info("Last sign in", String(authUser.user.last_sign_in_at ?? "never").slice(0, 16));
    const confirmedAt = authUser.user.email_confirmed_at;
    if (confirmedAt) ok("Email confirmed");
    else warn("Email NOT confirmed — cannot log in");
  }

  // ---- 8. Public page ----
  section("8. Public booking page");

  const publicUrl = `https://ocupaloc.ro/${slug}`;
  info("Public URL", publicUrl);

  if (activeServices.length === 0 || !programRaw || !onboardingDone) {
    fail("Booking page will show errors or no available slots (see issues above)");
  } else {
    ok("Booking page prerequisites satisfied");
  }

  // ---- Summary ----
  section("Summary");
  console.log("Diagnostic complete. Review warnings and failures above.\n");
}

run().catch((err) => {
  console.error("Diagnostic error:", err);
  process.exit(1);
});
