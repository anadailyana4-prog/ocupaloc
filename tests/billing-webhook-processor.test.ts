import assert from "node:assert/strict";
import test from "node:test";

import { processBillingWebhookEvent } from "../src/lib/billing/webhook-processor";

test("processBillingWebhookEvent is idempotent for the same Stripe event id", async () => {
  const processedIds = new Set<string>();
  let persistCalls = 0;

  const event = {
    id: "evt_same_123",
    type: "customer.subscription.updated",
    created: Math.floor(Date.now() / 1000),
    data: { object: {} }
  } as const;

  const deps = {
    async recordEvent(inputEvent: { id: string }) {
      if (processedIds.has(inputEvent.id)) {
        return "duplicate" as const;
      }
      processedIds.add(inputEvent.id);
      return "inserted" as const;
    },
    async buildSnapshot() {
      return {
        profesionistId: "11111111-1111-4111-8111-111111111111",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        status: "active" as const,
        currentPeriodEnd: null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        eventCreated: new Date().toISOString()
      };
    },
    async persistSnapshot() {
      persistCalls += 1;
    }
  };

  const first = await processBillingWebhookEvent(event as never, deps);
  const second = await processBillingWebhookEvent(event as never, deps);

  assert.deepEqual(first, { handled: true, duplicate: false });
  assert.deepEqual(second, { handled: true, duplicate: true });
  assert.equal(persistCalls, 1);
});
