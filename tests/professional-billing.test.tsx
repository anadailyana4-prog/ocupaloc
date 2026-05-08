import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ProfessionalBillingView } from "../src/app/(dashboard)/dashboard/billing/professional-billing-view";
import { loadProfessionalBillingModel } from "../src/lib/billing/professional-dashboard";

test("professional billing model is scoped to current professional and computes monthly metrics", async () => {
  let bookingCall = 0;
  const model = await loadProfessionalBillingModel("user-a", {
    now: new Date("2026-05-07T12:00:00.000Z"),
    billingEnabled: true,
    admin: {} as never,
    resolveProfessionalContext: async () => ({
      id: "prof-a",
      slug: "salon-a",
      businessName: "Salon A",
      createdAt: "2026-04-01T00:00:00.000Z"
    }),
    loadLatestSubscription: async () => ({
      status: "active",
      current_period_end: "2026-05-31T00:00:00.000Z",
      cancel_at_period_end: false,
      stripe_subscription_id: "sub_a",
      stripe_customer_id: "cus_a"
    }),
    countRelevantBookings: async ({ profesionistId }) => {
      assert.equal(profesionistId, "prof-a");
      bookingCall += 1;
      return bookingCall === 1 ? 12 : 7;
    },
    listPaidInvoices: async ({ stripeSubscriptionId }) => {
      assert.equal(stripeSubscriptionId, "sub_a");
      return [
        { amountPaid: 180, createdAt: new Date("2026-05-03T10:00:00.000Z") },
        { amountPaid: 120, createdAt: new Date("2026-05-05T10:00:00.000Z") },
        { amountPaid: 90, createdAt: new Date("2026-04-11T10:00:00.000Z") }
      ];
    }
  });

  assert.ok(model);
  assert.equal(model?.businessName, "Salon A");
  assert.equal(model?.status, "active");
  assert.equal(model?.revenueCurrentMonth, 300);
  assert.equal(model?.revenuePreviousMonth, 90);
  assert.equal(model?.bookingsCurrentMonth, 12);
  assert.equal(model?.bookingsPreviousMonth, 7);
  assert.equal(model?.providerWarning, null);
});

test("professional billing model keeps page safe when Stripe revenue loading fails", async () => {
  const model = await loadProfessionalBillingModel("user-a", {
    now: new Date("2026-05-07T12:00:00.000Z"),
    billingEnabled: true,
    admin: {} as never,
    resolveProfessionalContext: async () => ({
      id: "prof-a",
      slug: "salon-a",
      businessName: "Salon A",
      createdAt: "2026-04-01T00:00:00.000Z"
    }),
    loadLatestSubscription: async () => ({
      status: "past_due",
      current_period_end: "2026-05-31T00:00:00.000Z",
      cancel_at_period_end: false,
      stripe_subscription_id: "sub_a",
      stripe_customer_id: "cus_a"
    }),
    countRelevantBookings: async () => 0,
    listPaidInvoices: async () => {
      throw new Error("stripe down");
    }
  });

  assert.ok(model);
  assert.equal(model?.status, "past_due");
  assert.equal(model?.revenueCurrentMonth, 0);
  assert.ok(model?.providerWarning?.includes("Stripe"));
});

test("professional billing view shows professional-only content and hides global fleet metrics", () => {
  const html = renderToStaticMarkup(
    <ProfessionalBillingView
      model={{
        businessName: "Salon A",
        planName: "OcupaLoc Professional · 59.99 RON/lună",
        status: "none",
        statusLabel: "Fără abonament",
        statusMessage: "Nu există un abonament activ.",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        revenueCurrentMonth: 0,
        revenuePreviousMonth: 0,
        revenueDeltaPercent: null,
        bookingsCurrentMonth: 0,
        bookingsPreviousMonth: 0,
        trendLabels: ["dec. 25", "ian. 26", "feb. 26", "mar. 26", "apr. 26", "mai 26"],
        trendValues: [0, 0, 0, 0, 0, 0],
        providerWarning: null,
        canOpenCheckout: true,
        canOpenPortal: false,
        canCancelSubscription: false
      }}
    />
  );

  assert.ok(html.includes("Billing"));
  assert.ok(html.includes("Deschide checkout"));
  assert.ok(html.includes("Nu există încă venituri"));
  assert.ok(!html.includes("Top 10 salons"));
  assert.ok(!html.includes("Active salons"));
  assert.ok(!html.includes("MRR"));
  assert.ok(!html.includes("ARR"));
  assert.ok(!html.includes("Churn rate"));
});