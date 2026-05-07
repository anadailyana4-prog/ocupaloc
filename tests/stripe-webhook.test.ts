import assert from "node:assert/strict";
import test from "node:test";

import {
  handleStripeWebhookRequest,
  type StripeWebhookDeps
} from "../src/lib/billing/stripe-webhook-handler";

type StubEvent = { type: string; id: string; data: { object: Record<string, unknown> } };

function makeRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request("https://ocupaloc.ro/api/webhooks/stripe", {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}

async function jsonBody(res: Response): Promise<Record<string, unknown>> {
  return res.json() as Promise<Record<string, unknown>>;
}

function makeDeps(input: {
  event?: StubEvent;
  eventError?: Error;
  processResult?: { replayed: boolean };
  processError?: Error;
  onProcess?: (event: StubEvent) => void;
} = {}): StripeWebhookDeps {
  return {
    getStripe: () =>
      ({
        webhooks: {
          constructEventAsync: async () => {
            if (input.eventError) {
              throw input.eventError;
            }
            return input.event ?? { type: "invoice.paid", id: "evt_1", data: { object: {} } };
          }
        }
      }) as unknown as ReturnType<StripeWebhookDeps["getStripe"]>,
    getAdmin: () => ({}) as ReturnType<StripeWebhookDeps["getAdmin"]>,
    processEvent: async (_stripe, _admin, event) => {
      input.onProcess?.(event as unknown as StubEvent);
      if (input.processError) {
        throw input.processError;
      }
      return input.processResult ?? { replayed: false };
    }
  };
}

test("stripe webhook: returns 400 when STRIPE_WEBHOOK_SECRET is missing", async () => {
  delete process.env.STRIPE_WEBHOOK_SECRET;

  const res = await handleStripeWebhookRequest(
    makeRequest("{}", { "stripe-signature": "t=1,v1=sig" }),
    makeDeps()
  );

  assert.equal(res.status, 400);
  assert.match(String((await jsonBody(res)).error), /secret/i);
});

test("stripe webhook: returns 400 when stripe-signature header is missing", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

  const res = await handleStripeWebhookRequest(makeRequest("{}"), makeDeps());

  assert.equal(res.status, 400);
  assert.match(String((await jsonBody(res)).error), /signature/i);

  delete process.env.STRIPE_WEBHOOK_SECRET;
});

test("stripe webhook: returns 400 for invalid signature", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

  const res = await handleStripeWebhookRequest(
    makeRequest("{}", { "stripe-signature": "t=1,v1=bad" }),
    makeDeps({ eventError: new Error("invalid signature") })
  );

  assert.equal(res.status, 400);
  assert.match(String((await jsonBody(res)).error), /signature/i);

  delete process.env.STRIPE_WEBHOOK_SECRET;
});

test("stripe webhook: returns 200 and includes replayed=false when processing succeeds", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

  const seen: string[] = [];
  const res = await handleStripeWebhookRequest(
    makeRequest("{}", { "stripe-signature": "t=1,v1=ok" }),
    makeDeps({
      event: { type: "invoice.paid", id: "evt_paid_1", data: { object: {} } },
      processResult: { replayed: false },
      onProcess: (event) => seen.push(event.id)
    })
  );

  assert.equal(res.status, 200);
  const body = await jsonBody(res);
  assert.equal(body.received, true);
  assert.equal(body.replayed, false);
  assert.equal(body.eventId, "evt_paid_1");
  assert.deepEqual(seen, ["evt_paid_1"]);

  delete process.env.STRIPE_WEBHOOK_SECRET;
});

test("stripe webhook: returns 200 and includes replayed=true for duplicate event", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

  const res = await handleStripeWebhookRequest(
    makeRequest("{}", { "stripe-signature": "t=1,v1=ok" }),
    makeDeps({
      event: { type: "customer.subscription.updated", id: "evt_dupe_1", data: { object: {} } },
      processResult: { replayed: true }
    })
  );

  assert.equal(res.status, 200);
  const body = await jsonBody(res);
  assert.equal(body.received, true);
  assert.equal(body.replayed, true);

  delete process.env.STRIPE_WEBHOOK_SECRET;
});

test("stripe webhook: returns 500 when processing fails so Stripe can retry", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

  const res = await handleStripeWebhookRequest(
    makeRequest("{}", { "stripe-signature": "t=1,v1=ok" }),
    makeDeps({
      event: { type: "checkout.session.completed", id: "evt_fail_1", data: { object: {} } },
      processError: new Error("db unavailable")
    })
  );

  assert.equal(res.status, 500);
  const body = await jsonBody(res);
  assert.equal(body.received, false);
  assert.equal(body.eventId, "evt_fail_1");

  delete process.env.STRIPE_WEBHOOK_SECRET;
});
