import { redirect } from "next/navigation";

import { logOwnerAction, requireOwnerAdmin } from "@/lib/owner/auth";
import { getOwnerKpis } from "@/lib/owner/data";

export default async function OwnerRevenuePage() {
  try {
    await requireOwnerAdmin();
    await logOwnerAction("view_section", "revenue");
  } catch {
    redirect("/owner/login");
  }

  const stats = await getOwnerKpis();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Revenue</h1>
        <p className="text-slate-400 mt-1">MRR, ARR and subscription trend health</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-oc-amber/30 bg-oc-amber/10 p-4">
          <p className="text-xs font-semibold text-oc-amber-light uppercase">MRR</p>
          <p className="text-2xl font-bold text-oc-amber-light mt-2">{stats.mrrRon.toFixed(2)} RON</p>
        </div>
        <div className="rounded-lg border border-oc-amber/30 bg-oc-amber/10 p-4">
          <p className="text-xs font-semibold text-oc-amber-light uppercase">ARR</p>
          <p className="text-2xl font-bold text-oc-amber-light mt-2">{stats.arrRon.toFixed(2)} RON</p>
        </div>
        <div className="rounded-lg border border-emerald-700/30 bg-emerald-900/20 p-4">
          <p className="text-xs font-semibold text-emerald-300 uppercase">Trial to Paid</p>
          <p className="text-2xl font-bold text-emerald-100 mt-2">{stats.trialToPaidConversionPct.toFixed(2)}%</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-5">
        <h2 className="text-lg font-semibold text-slate-200 mb-3">Trend notes</h2>
        <ul className="space-y-2 text-slate-300 text-sm">
          <li>Monthly revenue is currently estimated from active subscriptions and configured plan price.</li>
          <li>Stripe vs DB reconciliation is available in Operations via billing operational events.</li>
          <li>Detailed historical trend chart: not instrumented yet.</li>
        </ul>
      </div>
    </div>
  );
}
