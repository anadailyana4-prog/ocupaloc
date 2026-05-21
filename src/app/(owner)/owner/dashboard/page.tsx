import Link from "next/link";
import { redirect } from "next/navigation";

import { getOwnerKpis } from "@/lib/owner/data";
import { logOwnerAction, requireOwnerAdmin } from "@/lib/owner/auth";

const KPICard = ({
  label,
  value,
  unit,
  color
}: {
  label: string;
  value: number | string;
  unit?: string;
  color?: string;
}) => (
  <div className={`rounded-xl border border-slate-700 bg-slate-800/50 p-4 ${color || "border-slate-700"}`}>
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-bold text-slate-100">
      {value.toLocaleString()}
      {unit ? <span className="ml-1 text-lg text-slate-400">{unit}</span> : null}
    </p>
  </div>
);

export default async function OwnerDashboardPage() {
  try {
    await requireOwnerAdmin();
    await logOwnerAction("view_dashboard");
  } catch {
    redirect("/owner/login");
  }

  const stats = await getOwnerKpis();

  if (!stats) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-400">Failed to load statistics</p>
      </div>
    );
  }

  const accountActivationPct = stats.totalAccounts > 0
    ? Math.round((stats.activeAccounts / stats.totalAccounts) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/70 p-6">
        <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
        <p className="mt-1 text-slate-400">Business overview and key metrics</p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Account Activation</p>
            <p className="mt-1 text-lg font-semibold text-slate-100">{accountActivationPct}% active</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Trial Conversion</p>
            <p className="mt-1 text-lg font-semibold text-slate-100">{stats.trialToPaidConversionPct.toFixed(1)}%</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Synthetic Monitor</p>
            <p className="mt-1 text-lg font-semibold text-slate-100">{stats.syntheticMonitorStatus}</p>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-200">Accounts and Users</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard label="Total Accounts" value={stats.totalAccounts} color="border-blue-600/30" />
          <KPICard label="Active Accounts" value={stats.activeAccounts} color="border-emerald-600/30" />
          <KPICard label="Trial Active" value={stats.trialActive} color="border-cyan-600/30" />
          <KPICard label="Trial Expired" value={stats.trialExpired} color="border-red-600/30" />
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-200">Revenue</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <KPICard label="MRR (estimat)" value={stats.mrrRon.toFixed(2)} unit="RON" color="border-oc-amber/30" />
          <KPICard label="Venit lunar (estimat)" value={stats.monthlyRevenueRon.toFixed(2)} unit="RON" color="border-oc-amber/30" />
          <KPICard label="ARR (derivat)" value={stats.arrRon.toFixed(2)} unit="RON" color="border-oc-amber/30" />
          <KPICard
            label="Conversion Rate Trial-to-Paid (derivat)"
            value={stats.trialToPaidConversionPct.toFixed(1)}
            unit="%"
            color="border-green-600/30"
          />
        </div>
        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/30 p-3 text-xs text-slate-300">
          <p>Venit facturat Stripe (billed): {stats.invoicedRevenue30dRon === null ? "neinstrumentat momentan" : `${stats.invoicedRevenue30dRon.toFixed(2)} RON`}</p>
          <p className="mt-1">Notă: MRR și venitul lunar sunt estimate din abonamente active; ARR este derivat din MRR.</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-200">Bookings Activity</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard label="Total Bookings" value={stats.bookingsTotal} color="border-purple-600/30" />
          <KPICard label="Last 24h" value={stats.bookings24h} color="border-purple-600/30" />
          <KPICard label="Last 7 days" value={stats.bookings7d} color="border-purple-600/30" />
          <KPICard label="Last 30 days" value={stats.bookings30d} color="border-purple-600/30" />
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-200">Operations Health</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <KPICard label="Successful Cron Jobs (24h)" value={stats.cronSuccess24h} color="border-green-600/30" />
          <KPICard label="Failed Cron Jobs (24h)" value={stats.cronFail24h} color="border-red-600/30" />
          <KPICard
            label="Booking Error Rate (7d)"
            value={stats.bookingErrorRate7dPct ?? "not instrumented yet"}
            unit={typeof stats.bookingErrorRate7dPct === "number" ? "%" : undefined}
            color="border-slate-600/30"
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-200">Health and Instrumentation</h2>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div className="rounded-lg border border-slate-700 p-4">
            <p className="text-slate-300">Emails sent/failed (24h)</p>
            <p className="mt-1 text-slate-100">
              {stats.emailsSent24h} / {stats.emailsFailed24h}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 p-4">
            <p className="text-slate-300">Synthetic monitor</p>
            <p className="mt-1 text-slate-100">{stats.syntheticMonitorStatus}</p>
          </div>
          <div className="rounded-lg border border-slate-700 p-4 md:col-span-2">
            <p className="text-slate-300">Not instrumented yet</p>
            <p className="mt-1 text-slate-100">{stats.notInstrumented.join(", ")}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-200">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Link
            href="/owner/businesses"
            className="rounded-lg border border-oc-amber/30 bg-oc-amber/10 px-4 py-2 text-center text-sm font-medium text-oc-amber-light transition hover:bg-oc-amber/20"
          >
            View All Businesses
          </Link>
          <Link
            href="/owner/subscriptions"
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-center text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20"
          >
            Subscriptions Overview
          </Link>
          <Link
            href="/owner/errors"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-center text-sm font-medium text-red-100 transition hover:bg-red-500/20"
          >
            View Errors and Incidents
          </Link>
        </div>
      </section>
    </div>
  );
}
