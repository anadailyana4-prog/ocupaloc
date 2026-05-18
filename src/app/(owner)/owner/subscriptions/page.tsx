import { redirect } from "next/navigation";
import { BILLING_EVENT_TYPES } from "@/lib/ops-event-taxonomy";
import { requireOwnerAdmin, logOwnerAction } from "@/lib/owner/auth";
import { getSubscriptionOverview } from "@/lib/owner/stats";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CancelReasonRow = {
  created_at: string;
  metadata: {
    reason?: string;
    cancelType?: string;
  } | null;
};

const CANCEL_REASON_LABELS: Record<string, string> = {
  prea_scump: "Prețul este prea mare",
  lipsa_functii: "Lipsesc funcții importante",
  temporar_inchis: "Business închis temporar",
  suport: "Probleme suport/stabilitate",
  altul: "Alt motiv"
};

export default async function OwnerSubscriptionsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const canceled = params.canceled === "1";
  const cancelError = typeof params.error === "string" ? params.error : null;

  try {
    await requireOwnerAdmin();
    await logOwnerAction("view_section", "subscriptions");
  } catch {
    redirect("/owner/login");
  }

  const subscriptions = await getSubscriptionOverview();
  const supabase = await createSupabaseServerClient();
  const { data: billingSignals } = await supabase
    .from("operational_events")
    .select("event_type, outcome, created_at")
    .eq("flow", "billing")
    .order("created_at", { ascending: false })
    .limit(50);

  const cancelSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: cancelReasonEvents } = await supabase
    .from("operational_events")
    .select("created_at, metadata")
    .eq("flow", "billing")
    .eq("event_type", BILLING_EVENT_TYPES.SUBSCRIPTION_CANCELED)
    .gte("created_at", cancelSince)
    .order("created_at", { ascending: false })
    .limit(500);

  const reasonCounter = new Map<string, number>();
  const cancelTypeCounter = new Map<string, number>();

  for (const row of (cancelReasonEvents ?? []) as CancelReasonRow[]) {
    const reasonKey = String(row.metadata?.reason ?? "unknown").trim() || "unknown";
    reasonCounter.set(reasonKey, (reasonCounter.get(reasonKey) ?? 0) + 1);

    const cancelType = String(row.metadata?.cancelType ?? "unspecified").trim() || "unspecified";
    cancelTypeCounter.set(cancelType, (cancelTypeCounter.get(cancelType) ?? 0) + 1);
  }

  const cancelReasonDistribution = Array.from(reasonCounter.entries())
    .map(([reason, count]) => ({
      reason,
      label: CANCEL_REASON_LABELS[reason] ?? reason,
      count
    }))
    .sort((a, b) => b.count - a.count);

  const cancelTypeDistribution = Array.from(cancelTypeCounter.entries())
    .map(([cancelType, count]) => ({ cancelType, count }))
    .sort((a, b) => b.count - a.count);

  const stats = {
    active: subscriptions.filter(s => s.status === "active").length,
    reactivated: subscriptions.filter(s => s.status === "reactivated").length,
    trial: subscriptions.filter(s => s.status === "trialing").length,
    canceled: subscriptions.filter(s => s.status === "canceled").length,
    past_due: subscriptions.filter(s => s.status === "past_due").length
  };

  const inconsistentStatuses = subscriptions.filter((s) => {
    if (s.status === "active") return false;
    if (s.status === "reactivated") return false;
    if (s.status === "trialing") return false;
    if (s.status === "canceled") return false;
    if (s.status === "past_due") return false;
    return true;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Subscriptions</h1>
        <p className="text-slate-400 mt-1">Manage customer billing</p>
      </div>

      {canceled && (
        <div className="rounded-lg border border-emerald-600/40 bg-emerald-900/20 px-4 py-3 text-emerald-100 text-sm">
          ✓ Subscription canceled successfully.
        </div>
      )}
      {cancelError && (
        <div className="rounded-lg border border-red-600/40 bg-red-900/20 px-4 py-3 text-red-100 text-sm">
          ✗ Error: {cancelError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="rounded-lg border border-emerald-700/30 bg-emerald-900/20 p-4">
          <p className="text-xs font-semibold text-emerald-400 uppercase">Active</p>
          <p className="text-2xl font-bold text-emerald-100 mt-2">{stats.active}</p>
        </div>
        <div className="rounded-lg border border-teal-700/30 bg-teal-900/20 p-4">
          <p className="text-xs font-semibold text-teal-400 uppercase">Reactivated</p>
          <p className="text-2xl font-bold text-teal-100 mt-2">{stats.reactivated}</p>
        </div>
        <div className="rounded-lg border border-cyan-700/30 bg-cyan-900/20 p-4">
          <p className="text-xs font-semibold text-cyan-400 uppercase">Trial</p>
          <p className="text-2xl font-bold text-cyan-100 mt-2">{stats.trial}</p>
        </div>
        <div className="rounded-lg border border-orange-700/30 bg-orange-900/20 p-4">
          <p className="text-xs font-semibold text-orange-400 uppercase">Past Due</p>
          <p className="text-2xl font-bold text-orange-100 mt-2">{stats.past_due}</p>
        </div>
        <div className="rounded-lg border border-red-700/30 bg-red-900/20 p-4">
          <p className="text-xs font-semibold text-red-400 uppercase">Canceled</p>
          <p className="text-2xl font-bold text-red-100 mt-2">{stats.canceled}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4 text-sm text-slate-300">
        <p>Inconsistent statuses: {inconsistentStatuses}</p>
        <p>Billing reconciliation signals: {(billingSignals ?? []).length}</p>
      </div>

      <section className="rounded-lg border border-slate-700 bg-slate-900/30 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Cancel reason analytics (30 zile)</h2>
            <p className="text-sm text-slate-400">Distribuție pe motive și tip de anulare din evenimentele operaționale.</p>
          </div>
          <a
            href="/api/owner/billing/cancel-reasons?windowDays=30"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-amber-300 hover:text-amber-200"
          >
            JSON query-ready
          </a>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-700/70 bg-slate-950/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Top motive anulare</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {cancelReasonDistribution.length === 0 ? (
                <li className="text-slate-400">Nu există anulări în ultimele 30 zile.</li>
              ) : (
                cancelReasonDistribution.map((item) => (
                  <li key={item.reason} className="flex items-center justify-between">
                    <span>{item.label}</span>
                    <span className="font-semibold text-slate-100">{item.count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-lg border border-slate-700/70 bg-slate-950/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tip anulare</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {cancelTypeDistribution.length === 0 ? (
                <li className="text-slate-400">Nu există date de tip anulare.</li>
              ) : (
                cancelTypeDistribution.map((item) => (
                  <li key={item.cancelType} className="flex items-center justify-between">
                    <span>{item.cancelType}</span>
                    <span className="font-semibold text-slate-100">{item.count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>

      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Renews</th>
                <th className="px-4 py-3">Stripe ID</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {subscriptions.map((sub) => {
                const subRecord = sub as unknown as Record<string, unknown>;
                const profObj = subRecord.profesionisti as unknown as Record<string, unknown>;
                const profName = String(profObj?.nume_business || "—");
                return (
                <tr key={sub.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-100">{profName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        sub.status === "active"
                          ? "bg-emerald-500/10 text-emerald-100 border-emerald-500/30"
                          : sub.status === "reactivated"
                            ? "bg-teal-500/10 text-teal-100 border-teal-500/30"
                          : "bg-slate-500/10 text-slate-100 border-slate-500/30"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {new Date(sub.current_period_end).toLocaleDateString("ro-RO")}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">
                    {sub.stripe_subscription_id?.slice(0, 20)}...
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <a
                        href={`https://dashboard.stripe.com/subscriptions/${sub.stripe_subscription_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-amber-300 hover:text-amber-200"
                      >
                        Stripe
                      </a>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <section className="rounded-lg border border-red-700/30 bg-red-900/10 p-5">
        <h2 className="text-lg font-semibold text-red-100 mb-3">Safe cancel flow</h2>
        <p className="text-sm text-red-200 mb-3">
          This action requires explicit confirmation and creates an owner audit log.
        </p>
        <form method="POST" action="/api/owner/subscriptions/cancel" className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            name="profesionistId"
            placeholder="Business ID"
            required
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
          />
          <input
            name="reason"
            placeholder="Reason"
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
          />
          <input
            name="confirmationText"
            placeholder="Type CONFIRM_CANCEL"
            required
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
          />
          <button type="submit" className="px-3 py-2 rounded-lg border border-red-500/50 text-red-100 bg-red-500/20">
            Cancel subscription safely
          </button>
        </form>
      </section>
    </div>
  );
}
