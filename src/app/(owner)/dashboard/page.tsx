import { redirect } from "next/navigation";
import Link from "next/link";
import { requireOwnerAdmin, logOwnerAction } from "@/lib/owner/auth";
import { getBusinessStats } from "@/lib/owner/stats";

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
  <div
    className={`rounded-lg border border-slate-700 bg-slate-800/50 p-4 ${
      color || "border-slate-700"
    }`}
  >
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
      {label}
    </p>
    <p className="text-2xl font-bold text-slate-100 mt-2">
      {value.toLocaleString()}
      {unit && <span className="text-lg text-slate-400 ml-1">{unit}</span>}
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

  const stats = await getBusinessStats();

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Failed to load statistics</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 mt-1">Business overview and key metrics</p>
      </div>

      {/* KPI Grid - Accounts */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">
          Accounts & Users
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total Accounts"
            value={stats.total_accounts}
            color="border-blue-600/30"
          />
          <KPICard
            label="Active Subscriptions"
            value={stats.active_subscriptions}
            color="border-emerald-600/30"
          />
          <KPICard
            label="Trial Accounts"
            value={stats.trial_subscriptions}
            color="border-cyan-600/30"
          />
          <KPICard
            label="Canceled"
            value={stats.canceled_subscriptions}
            color="border-red-600/30"
          />
        </div>
      </section>

      {/* KPI Grid - Revenue */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Revenue</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            label="Estimated MRR"
            value={stats.estimated_mrr.toFixed(2)}
            unit="RON"
            color="border-amber-600/30"
          />
          <KPICard
            label="Estimated ARR"
            value={stats.estimated_arr.toFixed(2)}
            unit="RON"
            color="border-amber-600/30"
          />
          <KPICard
            label="Conversion Rate (Trial→Paid)"
            value={stats.conversion_rate_trial_to_paid.toFixed(1)}
            unit="%"
            color="border-green-600/30"
          />
        </div>
      </section>

      {/* KPI Grid - Bookings */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">
          Bookings Activity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total Bookings"
            value={stats.total_bookings}
            color="border-purple-600/30"
          />
          <KPICard
            label="Last 24h"
            value={stats.bookings_last_24h}
            color="border-purple-600/30"
          />
          <KPICard
            label="Last 7 days"
            value={stats.bookings_last_7d}
            color="border-purple-600/30"
          />
          <KPICard
            label="Last 30 days"
            value={stats.bookings_last_30d}
            color="border-purple-600/30"
          />
        </div>
      </section>

      {/* KPI Grid - Operations */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">
          Operations Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            label="Successful Cron Jobs (24h)"
            value={stats.successful_cron_jobs_last_24h}
            color="border-green-600/30"
          />
          <KPICard
            label="Failed Cron Jobs (24h)"
            value={stats.failed_cron_jobs_last_24h}
            color="border-red-600/30"
          />
          <KPICard
            label="Total Locations"
            value={stats.total_locations}
            color="border-slate-600/30"
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            href="/owner/businesses"
            className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-100 hover:bg-amber-500/20 transition text-center text-sm font-medium"
          >
            View All Businesses →
          </Link>
          <Link
            href="/owner/subscriptions"
            className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 hover:bg-emerald-500/20 transition text-center text-sm font-medium"
          >
            Subscriptions Overview →
          </Link>
          <Link
            href="/owner/errors"
            className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-100 hover:bg-red-500/20 transition text-center text-sm font-medium"
          >
            View Errors & Incidents →
          </Link>
        </div>
      </section>
    </div>
  );
}
