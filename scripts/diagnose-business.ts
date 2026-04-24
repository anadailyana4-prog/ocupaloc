/**
 * pnpm run diagnose:business -- --slug=<slug>
 *
 * Founder-facing diagnostic tool. Answers in seconds why a given business
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
  console.error("Usage: pnpm run diagnose:business -- --slug=<slug>");
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
    .select("id, slug, email_contact, nume_business, onboarding_pas, program, created_at, user_id, notificari_email_nou")
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

  const { count: pendingUpcomingCount } = await supabase
    .from("programari")
    .select("id", { count: "exact", head: true })
    .eq("profesionist_id", prof.id)
    .eq("status", "in_asteptare")
    .gte("data_start", now.toISOString());

  const { count: totalBookings } = await supabase
    .from("programari")
    .select("id", { count: "exact", head: true })
    .eq("profesionist_id", prof.id);

  // Last confirmed/finalized booking for inactivity signal
  const { data: lastConfirmedRows } = await supabase
    .from("programari")
    .select("data_start")
    .eq("profesionist_id", prof.id)
    .in("status", ["confirmat", "finalizat"])
    .order("data_start", { ascending: false })
    .limit(1);

  const lastConfirmedIso = lastConfirmedRows?.[0]?.data_start as string | null ?? null;
  const daysSinceLastConfirmed = lastConfirmedIso
    ? Math.floor((now.getTime() - new Date(lastConfirmedIso).getTime()) / (24 * 60 * 60 * 1000))
    : null;

  info("Total bookings (all time)", String(totalBookings ?? 0));
  info("Upcoming confirmed (7 days)", String(upcomingCount ?? 0));
  if ((pendingUpcomingCount ?? 0) > 0) {
    warn(`Pending (in_asteptare) upcoming: ${pendingUpcomingCount}`, "clients awaiting confirmation — check and confirm or contact");
  } else {
    info("Pending (in_asteptare) upcoming", "0");
  }

  if (lastConfirmedIso) {
    const label = `last confirmed: ${lastConfirmedIso.slice(0, 10)} (${daysSinceLastConfirmed}d ago)`;
    if (daysSinceLastConfirmed! > 30) fail("No confirmed bookings in 30+ days", label);
    else if (daysSinceLastConfirmed! > 14) warn("No confirmed bookings in 14+ days", label);
    else ok("Recent confirmed booking", label);
  } else {
    warn("No confirmed or finalized bookings found (all time)");
  }

  if ((recentBookings ?? []).length > 0) {
    ok("Bookings in last 7 days (any status)");
    for (const b of recentBookings ?? []) {
      info(`  ${String(b.data_start).slice(0, 16)}  ${b.status}  ${b.nume_client}`);
    }
  } else {
    warn("No bookings in the last 7 days");
  }

  // ---- 4b. Schedule utilization (last 7 days) ----
  section("4b. Schedule utilization (last 7 days)");

  const { data: bookedRows } = await supabase
    .from("programari")
    .select("data_start, data_final")
    .eq("profesionist_id", prof.id)
    .in("status", ["confirmat", "finalizat"])
    .gte("data_start", sevenDaysAgo.toISOString())
    .lt("data_start", now.toISOString());

  let scheduledMinutes = 0;
  if (programRaw) {
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dayMap = ["duminica", "luni", "marti", "miercuri", "joi", "vineri", "sambata"] as const;
      const dayKey = dayMap[d.getDay()]!;
      const interval = programRaw[dayKey];
      if (Array.isArray(interval) && interval.length === 2) {
        const [sh, sm] = (interval[0] as string).split(":").map(Number);
        const [eh, em] = (interval[1] as string).split(":").map(Number);
        const mins = (eh * 60 + (em ?? 0)) - (sh * 60 + (sm ?? 0));
        if (mins > 0) scheduledMinutes += mins;
      }
    }
  }

  let bookedMinutes = 0;
  for (const b of bookedRows ?? []) {
    if (b.data_final && b.data_start) {
      const diffMs = new Date(b.data_final as string).getTime() - new Date(b.data_start as string).getTime();
      bookedMinutes += Math.max(0, Math.round(diffMs / 60000));
    }
  }

  if (scheduledMinutes === 0) {
    warn("Cannot compute utilization — no schedule configured or no working days in last 7d");
  } else {
    const utilPct = Math.min(100, Math.round((bookedMinutes / scheduledMinutes) * 100));
    const detail = `${bookedMinutes}min booked / ${scheduledMinutes}min scheduled = ${utilPct}%`;
    if (utilPct >= 70) ok(`Utilization ${utilPct}% — strong`, detail);
    else if (utilPct >= 40) warn(`Utilization ${utilPct}% — moderate`, detail);
    else if (utilPct > 0) warn(`Utilization ${utilPct}% — low`, detail);
    else fail(`Utilization 0% — no booked time last week`, detail);
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
    // Compute trial status from account age
    const createdAt = prof.created_at ? new Date(prof.created_at as string) : null;
    const TRIAL_DAYS = 30;
    const trialEnd = createdAt ? new Date(createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000) : null;
    if (trialEnd) {
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      if (daysLeft > 0) {
        warn("No subscription record — on local trial", `${daysLeft} days left (expires ${trialEnd.toISOString().slice(0, 10)})`);
      } else {
        fail("Trial expired", `expired ${trialEnd.toISOString().slice(0, 10)} (${Math.abs(daysLeft)} days ago)`);
      }
    } else {
      warn("No subscription record found — account is on trial or has never subscribed");
    }
  } else {
    info("Subscription status", sub.status);
    if (sub.current_period_end) {
      const periodEnd = new Date(sub.current_period_end);
      const daysUntilRenewal = Math.ceil((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      const renewalStr = `${periodEnd.toISOString().slice(0, 10)} (in ${daysUntilRenewal} days)`;
      if (daysUntilRenewal <= 3) {
        warn("Renews very soon", renewalStr);
      } else if (daysUntilRenewal <= 0) {
        fail("Period end passed", renewalStr);
      } else {
        info("Renews / expires", renewalStr);
      }
    }
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

  // ---- 6b. No-show stats ----
  section("6b. No-show stats (last 30 days)");

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const { count: noShowCount30d } = await supabase
    .from("programari")
    .select("id", { count: "exact", head: true })
    .eq("profesionist_id", prof.id)
    .eq("status", "noaparit")
    .gte("data_start", thirtyDaysAgo.toISOString());

  const { count: finalisedCount30d } = await supabase
    .from("programari")
    .select("id", { count: "exact", head: true })
    .eq("profesionist_id", prof.id)
    .eq("status", "finalizat")
    .gte("data_start", thirtyDaysAgo.toISOString());

  const total30d = (noShowCount30d ?? 0) + (finalisedCount30d ?? 0);
  const noShowRate = total30d > 0 ? Math.round(((noShowCount30d ?? 0) / total30d) * 100) : null;

  info("No-shows (30d)", String(noShowCount30d ?? 0));
  info("Finalized (30d)", String(finalisedCount30d ?? 0));
  if (noShowRate !== null) {
    if (noShowRate >= 20) fail(`No-show rate ${noShowRate}% — high`, "consider reviewing repeat no-show clients");
    else if (noShowRate >= 10) warn(`No-show rate ${noShowRate}% — elevated`);
    else ok(`No-show rate ${noShowRate}%`);
  } else {
    info("No-show rate: n/a (no finalized or no-show bookings in last 30d)");
  }

  // ---- 6c. Cancellation & booking quality (last 30 days) ----
  section("6c. Cancellation & booking quality (last 30 days)");

  const { count: clientCancelCount30d } = await supabase
    .from("programari_status_events")
    .select("id", { count: "exact", head: true })
    .eq("profesionist_id", prof.id)
    .eq("status", "anulat")
    .eq("source", "client_link")
    .gte("created_at", thirtyDaysAgo.toISOString());

  const { count: confirmedCount30d } = await supabase
    .from("programari")
    .select("id", { count: "exact", head: true })
    .eq("profesionist_id", prof.id)
    .in("status", ["confirmat", "finalizat"])
    .gte("data_start", thirtyDaysAgo.toISOString());

  const totalQuality30d = (confirmedCount30d ?? 0) + (noShowCount30d ?? 0) + (clientCancelCount30d ?? 0);
  const confirmationRate30d = totalQuality30d >= 5
    ? Math.round(((confirmedCount30d ?? 0) / totalQuality30d) * 100)
    : null;

  info("Client cancellations (30d)", String(clientCancelCount30d ?? 0));
  info("Confirmed/finalized (30d)", String(confirmedCount30d ?? 0));
  if (confirmationRate30d !== null) {
    if (confirmationRate30d >= 80) ok(`Confirmation rate ${confirmationRate30d}%`);
    else if (confirmationRate30d >= 60) warn(`Confirmation rate ${confirmationRate30d}% — elevated drop-off`, "check reminders and cancellation flow");
    else fail(`Confirmation rate ${confirmationRate30d}% — high drop-off`, "many bookings are not being honored");
  } else {
    info("Confirmation rate: n/a (fewer than 5 total bookings in window)");
  }
  if ((clientCancelCount30d ?? 0) >= 3) {
    const cancelRate = totalQuality30d > 0 ? Math.round(((clientCancelCount30d ?? 0) / totalQuality30d) * 100) : 0;
    warn(`${clientCancelCount30d} client cancellations (${cancelRate}% of activity)`, "consider adjusting reminder or policy");
  }

  // ---- 7. Auth user ----
  section("7. Auth user");

  const { data: authUser } = await supabase.auth.admin.getUserById(prof.user_id as string);
  if (!authUser.user) {
    fail("Auth user not found for this account");
  } else {
    ok("Auth user exists", authUser.user.email ?? "no email");
    const lastSignIn = authUser.user.last_sign_in_at;
    if (lastSignIn) {
      const lastSignInDate = new Date(lastSignIn);
      const daysSinceLogin = Math.floor((now.getTime() - lastSignInDate.getTime()) / (24 * 60 * 60 * 1000));
      if (daysSinceLogin > 30) {
        warn("Last sign-in was a long time ago", `${daysSinceLogin} days ago (${lastSignIn.slice(0, 10)})`);
      } else if (daysSinceLogin > 14) {
        warn("Owner hasn't logged in recently", `${daysSinceLogin} days ago`);
      } else {
        ok("Recently active", `last login ${daysSinceLogin} day${daysSinceLogin !== 1 ? "s" : ""} ago`);
      }
    } else {
      warn("Owner has never logged in");
    }
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
  section("Summary — Health Verdict");

  // Determine primary issue category for fast triage
  const setupIssue = !onboardingDone || activeServices.length === 0 || !programRaw;
  const billingIssue = sub?.status === "past_due" || sub?.status === "canceled" || (() => {
    if (!sub) {
      const createdAt = prof.created_at ? new Date(prof.created_at as string) : null;
      const trialEnd = createdAt ? new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000) : null;
      return trialEnd ? trialEnd < now : false;
    }
    return false;
  })();
  const adoptionIssue = !setupIssue && (totalBookings ?? 0) === 0;
  const inactivityIssue = !setupIssue && (daysSinceLastConfirmed ?? 0) > 14;
  const qualityIssue = confirmationRate30d !== null && confirmationRate30d < 60;
  const loginIssue = (() => {
    const lastSignIn = authUser?.user?.last_sign_in_at;
    if (!lastSignIn) return true;
    return Math.floor((now.getTime() - new Date(lastSignIn).getTime()) / (24 * 60 * 60 * 1000)) > 30;
  })();

  const issues: string[] = [];
  if (setupIssue) issues.push("SETUP — onboarding incomplete / no active services / no schedule");
  if (billingIssue) issues.push("BILLING — subscription expired or past_due");
  if (adoptionIssue) issues.push("ADOPTION — never had a confirmed booking");
  if (inactivityIssue) issues.push(`INACTIVITY — no confirmed booking for ${daysSinceLastConfirmed ?? "unknown"} days`);
  if (qualityIssue) issues.push(`QUALITY — confirmation rate ${confirmationRate30d}% (below 60%)`);
  if (loginIssue) issues.push("ENGAGEMENT — owner hasn't logged in for 30+ days");

  // Compute overall health band — single top-line verdict
  const healthBand = (() => {
    if (setupIssue || billingIssue) return "CRITICAL";
    if (adoptionIssue || inactivityIssue || qualityIssue) return "AT_RISK";
    if (loginIssue) return "WATCH";
    return "HEALTHY";
  })();
  const bandColor = { CRITICAL: "\x1b[31m", AT_RISK: "\x1b[33m", WATCH: "\x1b[36m", HEALTHY: "\x1b[32m" } as const;
  process.stdout.write(
    `\n\x1b[1mHealth Band:\x1b[0m  ${bandColor[healthBand]}\x1b[1m${healthBand}\x1b[0m\n`
  );

  if (issues.length === 0) {
    ok("No critical issues found — account appears healthy");
    info("Upcoming confirmed bookings (7d)", String(upcomingCount ?? 0));
    if (confirmationRate30d !== null) info("Confirmation rate (30d)", `${confirmationRate30d}%`);
  } else {
    process.stdout.write(`\n\x1b[1mIssues detected:\x1b[0m\n`);
    for (const issue of issues) {
      fail(issue);
    }
    process.stdout.write("\n");
    if (setupIssue) info("Next step", "Guide operator through setup: services \u2192 schedule \u2192 onboarding step 4");
    else if (adoptionIssue) info("Next step", "Share booking link via WhatsApp with 5+ existing clients");
    else if (inactivityIssue) info("Next step", "Check if operator is still running the business; consider quiet-rescue email");
    else if (billingIssue) info("Next step", "Check Stripe dashboard, send payment link, verify webhook delivery");
    else if (qualityIssue) info("Next step", "Check if reminder emails are sending correctly; review no-show rate");
    else if (loginIssue) info("Next step", "Reach out to operator \u2014 they may be using a different email or need re-engagement");
  }

  info("Booking page", publicUrl);
  console.log("\n" + "═".repeat(50) + "\n");
}

run().catch((err) => {
  console.error("Diagnostic error:", err);
  process.exit(1);
});
