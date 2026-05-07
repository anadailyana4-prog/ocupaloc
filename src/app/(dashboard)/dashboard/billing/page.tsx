import Link from "next/link";
import { redirect } from "next/navigation";

import { RevenueTrendChart } from "./revenue-trend-chart";
import { getStripeClient } from "@/lib/billing/stripe";
import { formatLei } from "@/lib/format-lei";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

type TopSalon = {
  salonId: string;
  salonName: string;
  revenueYtd: number;
  invoicesCount: number;
};

type BillingMetrics = {
  activeSalons: number;
  mrr: number;
  arr: number;
  ltv: number;
  churnRate: number;
  revenueYtd: number;
  revenueMtd: number;
  revenueWtd: number;
  topSalons: TopSalon[];
  trendLabels: string[];
  trendValues: number[];
};

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("ro-RO", { month: "short", year: "2-digit" });
}

function readSubscriptionSalonId(sub: { metadata?: Record<string, string> }): string | null {
  return sub.metadata?.profesionist_id ?? null;
}

async function loadBillingMetrics(): Promise<BillingMetrics> {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = startOfWeek(now);
  const trendStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const stripe = getStripeClient();
  const admin = createSupabaseServiceClient();

  const subscriptions: Array<{
    id: string;
    status: string;
    canceled_at: number | null;
    metadata: Record<string, string>;
    items: { data: Array<{ quantity: number | null; price: { unit_amount: number | null; recurring: { interval: string; interval_count: number | null } | null } }> };
  }> = [];

  for await (const sub of stripe.subscriptions.list({ status: "all", limit: 100 })) {
    subscriptions.push({
      id: sub.id,
      status: sub.status,
      canceled_at: sub.canceled_at,
      metadata: sub.metadata,
      items: {
        data: sub.items.data.map((item) => ({
          quantity: item.quantity ?? null,
          price: {
            unit_amount: item.price.unit_amount,
            recurring: item.price.recurring
              ? {
                  interval: item.price.recurring.interval,
                  interval_count: item.price.recurring.interval_count
                }
              : null
          }
        }))
      }
    });
    if (subscriptions.length >= 1200) break;
  }

  const invoices: Array<{ amount_paid: number; created: number; subscription: string | null }> = [];
  for await (const inv of stripe.invoices.list({
    status: "paid",
    limit: 100,
    created: { gte: Math.floor(yearStart.getTime() / 1000) }
  })) {
    const invRecord = inv as unknown as {
      subscription?: string | { id?: string | null } | null;
      parent?: { subscription_details?: { subscription?: string | null } | null } | null;
    };
    invoices.push({
      amount_paid: inv.amount_paid,
      created: inv.created,
      subscription:
        typeof invRecord.subscription === "string"
          ? invRecord.subscription
          : invRecord.subscription?.id ?? invRecord.parent?.subscription_details?.subscription ?? null
    });
    if (invoices.length >= 5000) break;
  }

  const subById = new Map(subscriptions.map((s) => [s.id, s]));
  const revenueBySalon = new Map<string, { revenueYtd: number; invoicesCount: number }>();
  const revenueByMonth = new Map<string, number>();

  let revenueYtd = 0;
  let revenueMtd = 0;
  let revenueWtd = 0;

  for (const inv of invoices) {
    const amountLei = inv.amount_paid / 100;
    const createdAt = new Date(inv.created * 1000);

    revenueYtd += amountLei;
    if (createdAt >= monthStart) revenueMtd += amountLei;
    if (createdAt >= weekStart) revenueWtd += amountLei;

    const mk = monthKey(createdAt);
    if (createdAt >= trendStart) {
      revenueByMonth.set(mk, (revenueByMonth.get(mk) ?? 0) + amountLei);
    }

    if (!inv.subscription) continue;
    const sub = subById.get(inv.subscription);
    const salonId = sub ? readSubscriptionSalonId(sub) : null;
    if (!salonId) continue;

    const prev = revenueBySalon.get(salonId) ?? { revenueYtd: 0, invoicesCount: 0 };
    prev.revenueYtd += amountLei;
    prev.invoicesCount += 1;
    revenueBySalon.set(salonId, prev);
  }

  const activeSubs = subscriptions.filter((s) => s.status === "active" || s.status === "trialing");
  const activeSalonSet = new Set(activeSubs.map((s) => readSubscriptionSalonId(s)).filter(Boolean) as string[]);
  const activeSalons = activeSalonSet.size;

  let mrr = 0;
  for (const sub of activeSubs) {
    for (const item of sub.items.data) {
      const recurring = item.price.recurring;
      const unitAmountLei = (item.price.unit_amount ?? 0) / 100;
      const qty = item.quantity ?? 1;
      if (!recurring || unitAmountLei <= 0) continue;

      const intervalCount = recurring.interval_count ?? 1;
      const monthlyValue = recurring.interval === "year"
        ? (unitAmountLei * qty) / (12 * intervalCount)
        : recurring.interval === "month"
          ? (unitAmountLei * qty) / intervalCount
          : 0;
      mrr += monthlyValue;
    }
  }

  const canceledThisMonth = subscriptions.filter((s) => {
    if (!s.canceled_at) return false;
    const canceledAt = new Date(s.canceled_at * 1000);
    return canceledAt >= monthStart;
  }).length;
  const churnRate = activeSalons + canceledThisMonth > 0
    ? (canceledThisMonth / (activeSalons + canceledThisMonth)) * 100
    : 0;

  const arr = mrr * 12;
  const arpa = activeSalons > 0 ? mrr / activeSalons : 0;
  const ltv = churnRate > 0 ? arpa / (churnRate / 100) : 0;

  const salonIds = Array.from(revenueBySalon.keys());
  const salonNames = new Map<string, string>();
  if (salonIds.length > 0) {
    const { data: profRows } = await admin
      .from("profesionisti")
      .select("id, slug, nume_business")
      .in("id", salonIds);

    for (const row of profRows ?? []) {
      salonNames.set(row.id, row.nume_business?.trim() || row.slug || row.id);
    }
  }

  const topSalons = Array.from(revenueBySalon.entries())
    .map(([salonId, values]) => ({
      salonId,
      salonName: salonNames.get(salonId) ?? salonId,
      revenueYtd: values.revenueYtd,
      invoicesCount: values.invoicesCount
    }))
    .sort((a, b) => b.revenueYtd - a.revenueYtd)
    .slice(0, 10);

  const trendLabels: string[] = [];
  const trendValues: number[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    trendLabels.push(monthLabel(d));
    trendValues.push(Number((revenueByMonth.get(key) ?? 0).toFixed(2)));
  }

  return {
    activeSalons,
    mrr: Number(mrr.toFixed(2)),
    arr: Number(arr.toFixed(2)),
    ltv: Number(ltv.toFixed(2)),
    churnRate: Number(churnRate.toFixed(2)),
    revenueYtd: Number(revenueYtd.toFixed(2)),
    revenueMtd: Number(revenueMtd.toFixed(2)),
    revenueWtd: Number(revenueWtd.toFixed(2)),
    topSalons,
    trendLabels,
    trendValues
  };
}

export const dynamic = "force-dynamic";

export default async function DashboardBillingPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  let metrics: BillingMetrics | null = null;
  let loadError: string | null = null;

  try {
    metrics = await loadBillingMetrics();
  } catch {
    loadError = "Nu am putut încărca metricile de revenue acum.";
  }

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-wide text-amber-100">Billing Metrics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Revenue tracking pentru monetizare și vizibilitate fleet-level.</p>
        </div>
        <Link
          href="/billing/checkout"
          className="inline-flex items-center rounded-full border-0 bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:brightness-105"
        >
          Upgrade salon
        </Link>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">{loadError}</div>
      ) : null}

      {metrics ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="lux-card p-4"><p className="text-xs text-muted-foreground">Active salons</p><p className="mt-1 text-2xl font-semibold text-amber-100">{metrics.activeSalons}</p></div>
            <div className="lux-card p-4"><p className="text-xs text-muted-foreground">MRR</p><p className="mt-1 text-2xl font-semibold text-amber-100">{formatLei(metrics.mrr)}</p></div>
            <div className="lux-card p-4"><p className="text-xs text-muted-foreground">ARR</p><p className="mt-1 text-2xl font-semibold text-amber-100">{formatLei(metrics.arr)}</p></div>
            <div className="lux-card p-4"><p className="text-xs text-muted-foreground">LTV</p><p className="mt-1 text-2xl font-semibold text-amber-100">{formatLei(metrics.ltv)}</p></div>
            <div className="lux-card p-4"><p className="text-xs text-muted-foreground">Churn rate</p><p className="mt-1 text-2xl font-semibold text-amber-100">{metrics.churnRate.toFixed(2)}%</p></div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="lux-card p-4"><p className="text-xs text-muted-foreground">Revenue YTD</p><p className="mt-1 text-xl font-semibold text-zinc-100">{formatLei(metrics.revenueYtd)}</p></div>
            <div className="lux-card p-4"><p className="text-xs text-muted-foreground">Revenue MTD</p><p className="mt-1 text-xl font-semibold text-zinc-100">{formatLei(metrics.revenueMtd)}</p></div>
            <div className="lux-card p-4"><p className="text-xs text-muted-foreground">Revenue WTD</p><p className="mt-1 text-xl font-semibold text-zinc-100">{formatLei(metrics.revenueWtd)}</p></div>
          </div>

          <div className="lux-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Revenue trend</h2>
            <RevenueTrendChart labels={metrics.trendLabels} values={metrics.trendValues} />
          </div>

          <div className="lux-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Top 10 salons by revenue</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-muted-foreground">
                    <th className="py-2 pr-2">Salon</th>
                    <th className="py-2 pr-2">Revenue YTD</th>
                    <th className="py-2 pr-2">Invoices</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topSalons.map((row) => (
                    <tr key={row.salonId} className="border-b border-zinc-900/80">
                      <td className="py-2 pr-2 text-zinc-200">{row.salonName}</td>
                      <td className="py-2 pr-2 text-zinc-100">{formatLei(row.revenueYtd)}</td>
                      <td className="py-2 pr-2 text-zinc-300">{row.invoicesCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}