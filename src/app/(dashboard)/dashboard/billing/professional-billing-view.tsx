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
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    case "reactivated":
      return "border-oc-teal bg-oc-teal-soft text-oc-teal";
    case "trial":
    case "trialing":
      return "border-sky-300 bg-sky-50 text-sky-800";
    case "past_due":
    case "incomplete":
      return "border-red-300 bg-red-50 text-red-800";
    case "canceled":
    case "paused":
      return "border-orange-300 bg-orange-50 text-orange-800";
    case "disabled":
      return "border oc-border bg-white oc-secondary-text";
    default:
      return "border oc-border bg-white oc-secondary-text";
  }
}

function deltaLabel(value: number | null): string {
  if (value == null) return "Fără istoric suficient";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}% vs luna trecută`;
}

export function ProfessionalBillingView({ model }: Props) {
  const emptyState = model.revenueCurrentMonth === 0 && model.revenuePreviousMonth === 0 && model.bookingsCurrentMonth === 0;

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="dash-page-title">Billing</h1>
          <p className="mt-1 text-sm text-muted-foreground">Abonamentul și metricile relevante doar pentru business-ul tău.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {model.canOpenCheckout ? (
            <Link
              href="/billing/checkout"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-oc-amber-light to-oc-amber text-white text-sm font-semibold hover:brightness-105"
            >
              Upgrade
            </Link>
          ) : null}
          {model.canOpenPortal ? (
            <form method="post" action="/api/billing/portal">
              <button
                type="submit"
                className="inline-flex items-center rounded-full dash-chip px-4 py-2 text-sm font-medium oc-text hover:border-oc-teal/40"
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
            <div className="text-xl font-semibold oc-text">{model.planName}</div>
            <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(model.status)}`}>
              {model.statusLabel}
            </div>
          </div>
          <div className="text-sm oc-secondary-text sm:text-right">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Business</div>
            <div>{model.businessName}</div>
          </div>
        </div>
        <p className="mt-4 text-sm oc-secondary-text">{model.statusMessage}</p>
        {model.providerWarning ? (
          <div className="mt-4 rounded-2xl border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900">{model.providerWarning}</div>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="lux-card p-4">
          <p className="text-xs text-muted-foreground">Luna aceasta</p>
          <p className="mt-1 text-2xl font-semibold oc-accent">{formatLei(model.revenueCurrentMonth)}</p>
        </div>
        <div className="lux-card p-4">
          <p className="text-xs text-muted-foreground">Luna trecută</p>
          <p className="mt-1 text-2xl font-semibold oc-text">{formatLei(model.revenuePreviousMonth)}</p>
        </div>
        <div className="lux-card p-4">
          <p className="text-xs text-muted-foreground">Booking-uri luna aceasta</p>
          <p className="mt-1 text-2xl font-semibold oc-text">{model.bookingsCurrentMonth}</p>
        </div>
        <div className="lux-card p-4">
          <p className="text-xs text-muted-foreground">Delta venit</p>
          <p className="mt-1 text-2xl font-semibold oc-text">{deltaLabel(model.revenueDeltaPercent)}</p>
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
              className="inline-flex items-center rounded-full bg-gradient-to-r from-oc-amber-light to-oc-amber text-white text-sm font-semibold hover:brightness-105"
            >
              Deschide checkout
            </Link>
          ) : null}
          {model.canOpenPortal ? (
            <form method="post" action="/api/billing/portal">
              <button
                type="submit"
                className="inline-flex items-center rounded-full dash-chip px-4 py-2 text-sm font-medium oc-text hover:border-oc-teal/40"
              >
                Deschide portalul de billing
              </button>
            </form>
          ) : null}
          {model.canCancelSubscription ? <CancelSubscriptionButton /> : null}
        </div>
      </section>

      {emptyState ? (
        <section className="rounded-2xl border dash-dialog/60 px-4 py-4 text-sm oc-secondary-text">
          Nu există încă venituri sau suficiente booking-uri pentru această perioadă. Pagina rămâne disponibilă și va afișa datele imediat ce apar facturi sau programări relevante.
        </section>
      ) : null}
    </div>
  );
}