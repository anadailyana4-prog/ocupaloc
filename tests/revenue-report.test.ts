import assert from "node:assert/strict";
import test from "node:test";

import { renderRevenueDigestEmail } from "../src/lib/email/revenue-digest";
import { runWeeklyRevenueReport } from "../src/lib/jobs/revenue-report";

test("weekly revenue report aggregates mocked Stripe data correctly", async () => {
  const now = new Date("2026-05-07T12:00:00.000Z");
  const sent: Array<{ to: string[]; subject: string; text: string; html: string }> = [];

  const subscriptions = [
    {
      id: "sub_a",
      status: "active",
      cancelAtPeriodEnd: false,
      metadata: { profesionist_id: "salon-a" }
    },
    {
      id: "sub_b",
      status: "past_due",
      cancelAtPeriodEnd: false,
      metadata: { profesionist_id: "salon-b" }
    }
  ];

  const invoices = [
    { subscription: "sub_a", amountPaid: 300, createdAt: new Date("2026-05-05T10:00:00.000Z") },
    { subscription: "sub_a", amountPaid: 200, createdAt: new Date("2026-05-03T10:00:00.000Z") },
    { subscription: "sub_b", amountPaid: 120, createdAt: new Date("2026-04-27T10:00:00.000Z") }
  ];

  const admin = {
    from: (table: string) => {
      assert.equal(table, "profesionisti");
      return {
        select: () => ({
          in: async () => ({
            data: [
              { id: "salon-a", nume_business: "Salon A", slug: "salon-a" },
              { id: "salon-b", nume_business: "Salon B", slug: "salon-b" }
            ]
          })
        })
      };
    }
  } as never;

  const result = await runWeeklyRevenueReport("req-revenue-1", {
    now,
    recipients: ["owner@ocupaloc.ro"],
    admin,
    listSubscriptions: async () => subscriptions,
    listInvoices: async () => invoices,
    sendEmail: async (input) => {
      sent.push(input);
    }
  });

  assert.equal(result.sent, true);
  assert.equal(result.recipients, 1);
  assert.equal(result.totalCurrentWeek, 500);
  assert.equal(result.totalPreviousWeek, 120);
  assert.ok(result.growthPercent > 300);
  assert.equal(result.topPerformers[0]?.salonName, "Salon A");
  assert.equal(result.churnRiskSalons[0]?.salonName, "Salon B");
  assert.equal(sent.length, 1);
  assert.ok(sent[0]?.subject.includes("Revenue weekly digest"));
});

test("revenue digest template renders top performers and churn section", () => {
  const rendered = renderRevenueDigestEmail({
    weekLabel: "01.05.2026 - 07.05.2026",
    totalCurrentWeek: 2500,
    totalPreviousWeek: 2000,
    growthPercent: 25,
    topPerformers: [
      {
        salonId: "salon-a",
        salonName: "Salon A",
        revenueCurrentWeek: 1200,
        revenuePreviousWeek: 900,
        growthPercent: 33.33
      }
    ],
    churnRiskSalons: [
      {
        salonId: "salon-b",
        salonName: "Salon B",
        revenueCurrentWeek: 100,
        revenuePreviousWeek: 250,
        growthPercent: -60
      }
    ]
  });

  assert.ok(rendered.subject.includes("Revenue weekly digest"));
  assert.ok(rendered.html.includes("Top performers"));
  assert.ok(rendered.html.includes("Salon A"));
  assert.ok(rendered.html.includes("Churn risk"));
  assert.ok(rendered.text.includes("Salon B"));
});