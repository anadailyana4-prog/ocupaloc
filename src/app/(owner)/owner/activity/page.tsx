import { redirect } from "next/navigation";
import { BILLING_EVENT_TYPES } from "@/lib/ops-event-taxonomy";
import { ACTIVATION_FUNNEL_MILESTONES, weekStartKey } from "@/lib/owner/activation-funnel";
import { requireOwnerAdmin, logOwnerAction } from "@/lib/owner/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OwnerActivityPage() {
  try {
    await requireOwnerAdmin();
    await logOwnerAction("view_section", "activity");
  } catch {
    redirect("/owner/login");
  }

  const supabase = await createSupabaseServerClient();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: businesses }, { data: subscriptions }, { data: recentBookings }, { data: emailSent }, { data: billingEvents }] = await Promise.all([
    supabase
      .from("profesionisti")
      .select("id, created_at, onboarding_completed_at, first_booking_at, last_activity_at"),
    supabase.from("subscriptions").select("profesionist_id, status"),
    supabase
      .from("programari")
      .select("profesionist_id")
      .gte("created_at", since30d),
    supabase
      .from("email_queue")
      .select("id")
      .eq("status", "sent")
      .gte("created_at", since30d),
    supabase
      .from("operational_events")
      .select("entity_id, event_type, outcome, created_at")
      .eq("flow", "billing")
      .in("event_type", [BILLING_EVENT_TYPES.TRIAL_GRANTED, BILLING_EVENT_TYPES.SUBSCRIPTION_ACTIVATED])
      .gte("created_at", since30d)
  ]);

  const subMap = new Map<string, string>();
  for (const sub of subscriptions ?? []) {
    if (!subMap.has(sub.profesionist_id)) {
      subMap.set(sub.profesionist_id, sub.status);
    }
  }

  const rows = businesses ?? [];
  const accountCreated = rows.length;
  const onboardingCompleted = rows.filter((row) => Boolean(row.onboarding_completed_at)).length;
  const firstBooking = rows.filter((row) => Boolean(row.first_booking_at)).length;
  const trialActive = rows.filter((row) => subMap.get(row.id) === "trialing").length;
  const paidConversion = rows.filter((row) => {
    const status = subMap.get(row.id);
    return status === "active" || status === "reactivated";
  }).length;
  const publicLinkActive = rows.filter((row) => Boolean(row.onboarding_completed_at)).length;

  const now = Date.now();
  const inactiveAccounts = rows.filter((row) => {
    if (!row.last_activity_at) return true;
    const inactiveDays = (now - new Date(row.last_activity_at).getTime()) / (24 * 60 * 60 * 1000);
    return inactiveDays > 14;
  }).length;

  const noFirstBooking = rows.filter((row) => !row.first_booking_at).length;

  // Usage frequency: unique businesses that had at least one booking in last 30 days
  const activeBookersSet = new Set((recentBookings ?? []).map((b) => b.profesionist_id));
  const usageFrequencyPct = accountCreated > 0
    ? Math.round((activeBookersSet.size / accountCreated) * 100)
    : 0;

  const confirmationsSent = (emailSent ?? []).length;

  const activationByProf = new Map<string, string>();
  const cohortMap = new Map<string, { cohortWeek: string; trials: number; paid: number }>();

  for (const row of billingEvents ?? []) {
    const entityId = String(row.entity_id ?? "").trim();
    if (!entityId || row.outcome !== "success") continue;
    if (row.event_type !== BILLING_EVENT_TYPES.SUBSCRIPTION_ACTIVATED) continue;

    const existing = activationByProf.get(entityId);
    if (!existing || new Date(row.created_at).getTime() < new Date(existing).getTime()) {
      activationByProf.set(entityId, row.created_at);
    }
  }

  for (const row of billingEvents ?? []) {
    const entityId = String(row.entity_id ?? "").trim();
    if (!entityId || row.outcome !== "success") continue;
    if (row.event_type !== BILLING_EVENT_TYPES.TRIAL_GRANTED) continue;

    const cohortWeek = weekStartKey(row.created_at);
    const cohort = cohortMap.get(cohortWeek) ?? { cohortWeek, trials: 0, paid: 0 };
    cohort.trials += 1;

    if (activationByProf.has(entityId)) {
      cohort.paid += 1;
    }

    cohortMap.set(cohortWeek, cohort);
  }

  const trialToPaidCohorts = Array.from(cohortMap.values())
    .sort((a, b) => (a.cohortWeek < b.cohortWeek ? -1 : 1))
    .map((cohort) => ({
      ...cohort,
      conversionRatePct: cohort.trials > 0 ? Number(((cohort.paid / cohort.trials) * 100).toFixed(1)) : 0
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Activity</h1>
        <p className="text-slate-400 mt-1">Business activity and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
          <p className="text-xs uppercase text-slate-400">Inactive Accounts (&gt;14d)</p>
          <p className="text-2xl font-bold text-slate-100 mt-2">{inactiveAccounts}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
          <p className="text-xs uppercase text-slate-400">Onboarding Incomplete</p>
          <p className="text-2xl font-bold text-slate-100 mt-2">{Math.max(0, accountCreated - onboardingCompleted)}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
          <p className="text-xs uppercase text-slate-400">Signed Up, No First Booking</p>
          <p className="text-2xl font-bold text-slate-100 mt-2">{noFirstBooking}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
          <p className="text-xs uppercase text-slate-400">Usage Frequency (30d)</p>
          <p className="text-2xl font-bold text-slate-100 mt-2">{usageFrequencyPct}%</p>
          <p className="text-xs text-slate-500 mt-1">{activeBookersSet.size} of {accountCreated} with bookings</p>
        </div>
      </div>

      <section className="rounded-lg border border-slate-700 bg-slate-900/30 p-5">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Funnel</h2>
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex justify-between"><span>{ACTIVATION_FUNNEL_MILESTONES.ACCOUNT_CREATED.label}</span><span>{accountCreated}</span></div>
          <div className="flex justify-between"><span>{ACTIVATION_FUNNEL_MILESTONES.ONBOARDING_COMPLETED.label}</span><span>{onboardingCompleted}</span></div>
          <div className="flex justify-between"><span>Public link active (onboarding done)</span><span>{publicLinkActive}</span></div>
          <div className="flex justify-between"><span>{ACTIVATION_FUNNEL_MILESTONES.FIRST_BOOKING_CONFIRMED.label}</span><span>{firstBooking}</span></div>
          <div className="flex justify-between"><span>Confirmations sent (30d, email queue)</span><span>{confirmationsSent}</span></div>
          <div className="flex justify-between"><span>{ACTIVATION_FUNNEL_MILESTONES.TRIAL_GRANTED.label} (active)</span><span>{trialActive}</span></div>
          <div className="flex justify-between"><span>Paid conversion</span><span>{paidConversion}</span></div>
        </div>

        <div className="mt-4 border-t border-slate-700 pt-3">
          <a
            href="/api/owner/analytics/activation-funnel?windowDays=90"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-oc-amber-light hover:text-oc-amber"
          >
            Activation funnel + trial-to-paid cohort (JSON query-ready)
          </a>
        </div>

        <div className="mt-5 rounded-lg border border-slate-700/70 bg-slate-950/30 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Trial → Paid cohorts (30 zile)</h3>
          {trialToPaidCohorts.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">Nu există trial-uri în intervalul selectat.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-400">
                  <tr>
                    <th className="pb-2 pr-4">Săptămână cohortă</th>
                    <th className="pb-2 pr-4">Trials</th>
                    <th className="pb-2 pr-4">Paid</th>
                    <th className="pb-2">Conversie</th>
                  </tr>
                </thead>
                <tbody className="text-slate-200">
                  {trialToPaidCohorts.map((cohort) => (
                    <tr key={cohort.cohortWeek} className="border-t border-slate-800">
                      <td className="py-2 pr-4">{cohort.cohortWeek}</td>
                      <td className="py-2 pr-4">{cohort.trials}</td>
                      <td className="py-2 pr-4">{cohort.paid}</td>
                      <td className="py-2">{cohort.conversionRatePct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
