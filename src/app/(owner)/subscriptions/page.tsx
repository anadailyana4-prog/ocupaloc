import { redirect } from "next/navigation";
import { requireOwnerAdmin, logOwnerAction } from "@/lib/owner/auth";
import { getSubscriptionOverview } from "@/lib/owner/stats";

export default async function OwnerSubscriptionsPage() {
  try {
    await requireOwnerAdmin();
    await logOwnerAction("view_section", "subscriptions");
  } catch {
    redirect("/owner/login");
  }

  const subscriptions = await getSubscriptionOverview();

  const stats = {
    active: subscriptions.filter(s => s.status === "active").length,
    trial: subscriptions.filter(s => s.status === "trialing").length,
    canceled: subscriptions.filter(s => s.status === "canceled").length,
    past_due: subscriptions.filter(s => s.status === "past_due").length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Subscriptions</h1>
        <p className="text-slate-400 mt-1">Manage customer billing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-emerald-700/30 bg-emerald-900/20 p-4">
          <p className="text-xs font-semibold text-emerald-400 uppercase">Active</p>
          <p className="text-2xl font-bold text-emerald-100 mt-2">{stats.active}</p>
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

      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Renews</th>
                <th className="px-4 py-3">Stripe ID</th>
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
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
