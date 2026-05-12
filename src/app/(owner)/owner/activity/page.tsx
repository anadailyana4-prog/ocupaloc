import { redirect } from "next/navigation";
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
  const [{ data: businesses }, { data: subscriptions }, { data: recentBookings }, { data: emailSent }] = await Promise.all([
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
  const paidConversion = rows.filter((row) => subMap.get(row.id) === "active").length;
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
          <div className="flex justify-between"><span>Account created</span><span>{accountCreated}</span></div>
          <div className="flex justify-between"><span>Onboarding completed</span><span>{onboardingCompleted}</span></div>
          <div className="flex justify-between"><span>Public link active (onboarding done)</span><span>{publicLinkActive}</span></div>
          <div className="flex justify-between"><span>First booking</span><span>{firstBooking}</span></div>
          <div className="flex justify-between"><span>Confirmations sent (30d, email queue)</span><span>{confirmationsSent}</span></div>
          <div className="flex justify-between"><span>Trial active</span><span>{trialActive}</span></div>
          <div className="flex justify-between"><span>Paid conversion</span><span>{paidConversion}</span></div>
        </div>
      </section>
    </div>
  );
}
