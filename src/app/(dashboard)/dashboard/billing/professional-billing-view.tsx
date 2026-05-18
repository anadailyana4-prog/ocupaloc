import React from "react";
import Link from "next/link";

import { CancelSubscriptionButton } from "../cancel-subscription-button";
import { RevenueTrendChart } from "./revenue-trend-chart";
import { formatLei } from "@/lib/format-lei";
import type { ProfessionalBillingModel } from "@/lib/billing/professional-dashboard";

type Props = {
  model: ProfessionalBillingModel;
};

function statusTone(status: ProfessionalBillingModel["status"]): string {
  switch (status) {
    case "active":
      return "border-emerald-500/30 bg-emerald-950/30 text-emerald-200";
    case "reactivated":
      return "border-teal-500/30 bg-teal-950/30 text-teal-200";
    case "trial":
    case "trialing":
      return "border-sky-500/30 bg-sky-950/30 text-sky-200";
    case "past_due":
    case "incomplete":
      return "border-red-500/30 bg-red-950/30 text-red-200";
    case "canceled":
    case "paused":
      return "border-orange-500/30 bg-orange-950/30 text-orange-200";
    case "disabled":
      return "border-zinc-700 bg-zinc-900/60 text-zinc-300";
    default:
      return "border-zinc-700 bg-zinc-900/60 text-zinc-300";
  }
}

function deltaLabel(value: number | null): string {
  if (value == null) return "Fără istoric suficient";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}% vs luna trecută`;
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
}

export function ProfessionalBillingView({ model }: Props) {
  const emptyState = model.revenueCurrentMonth === 0 && model.revenuePreviousMonth === 0 && model.bookingsCurrentMonth === 0;

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-wide text-amber-100">Billing</h1>
          <p className="mt-1 text-sm text-muted-foreground">Abonamentul și metricile relevante doar pentru business-ul tău.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {model.canOpenCheckout ? (
            <Link
              href="/billing/checkout"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:brightness-105"
            >
              Upgrade
            </Link>
          ) : null}
          {model.canOpenPortal ? (
            <form method="post" action="/api/billing/portal">
              <button
                type="submit"
                className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-sm font-medium text-zinc-100 hover:border-zinc-500"
              >
                Gestionează billing
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <section className="lux-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Subscription overview</div>
            <div className="text-xl font-semibold text-zinc-100">{model.planName}</div>
            <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(model.status)}`}>
              {model.statusLabel}
            </div>
          </div>
          <div className="grid gap-3 text-sm text-zinc-300 sm:text-right">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Business</div>
              <div>{model.businessName}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Renewal / period end</div>
              <div>{formatDate(model.currentPeriodEnd)}</div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-zinc-300">{model.statusMessage}</p>
        {model.providerWarning ? (
          <div className="mt-4 rounded-2xl border border-orange-500/30 bg-orange-950/30 px-4 py-3 text-sm text-orange-200">{model.providerWarning}</div>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="lux-card p-4">
          <p className="text-xs text-muted-foreground">Luna aceasta</p>
          <p className="mt-1 text-2xl font-semibold text-amber-100">{formatLei(model.revenueCurrentMonth)}</p>
        </div>
        <div className="lux-card p-4">
          <p className="text-xs text-muted-foreground">Luna trecută</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">{formatLei(model.revenuePreviousMonth)}</p>
        </div>
        <div className="lux-card p-4">
          <p className="text-xs text-muted-foreground">Booking-uri luna aceasta</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">{model.bookingsCurrentMonth}</p>
        </div>
        <div className="lux-card p-4">
          <p className="text-xs text-muted-foreground">Delta venit</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">{deltaLabel(model.revenueDeltaPercent)}</p>
        </div>
      </section>

      <section className="lux-card p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Trend venit</h2>
          <p className="text-xs text-muted-foreground">Ultimele 6 luni</p>
        </div>
        <RevenueTrendChart labels={model.trendLabels} values={model.trendValues} />
      </section>

      <section className="lux-card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Acțiuni</h2>
        <div className="flex flex-wrap gap-3">
          {model.canOpenCheckout ? (
            <Link
              href="/billing/checkout"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:brightness-105"
            >
              Deschide checkout
            </Link>
          ) : null}
          {model.canOpenPortal ? (
            <form method="post" action="/api/billing/portal">
              <button
                type="submit"
                className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-sm font-medium text-zinc-100 hover:border-zinc-500"
              >
                Deschide portalul de billing
              </button>
            </form>
          ) : null}
          {model.canCancelSubscription ? <CancelSubscriptionButton /> : null}
        </div>
      </section>

      {emptyState ? (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-4 text-sm text-zinc-300">
          Nu există încă venituri sau suficiente booking-uri pentru această perioadă. Pagina rămâne disponibilă și va afișa datele imediat ce apar facturi sau programări relevante.
        </section>
      ) : null}
    </div>
  );
}