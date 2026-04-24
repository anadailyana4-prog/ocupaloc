/**
 * Unit tests for the Stripe webhook route handler.
 *
 * The handler is tested through its extracted handleStripeWebhookRequest function
 * (same DI pattern as book-request-handler). No real Stripe SDK or Next.js
 * server is required — all deps are replaced with stubs.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  handleStripeWebhookRequest,
  type StripeWebhookDeps
} from "../src/app/api/webhooks/stripe/route";

// ─── Stubs ───────────────────────────────────────────────────────────────────

function makeStripeDep(
  constructEventFn: (payload: string, sig: string, secret: string) => { type: string; id: string }
): StripeWebhookDeps {
  return {
    getStripe: () =>
      ({
        webhooks: {
          constructEvent: constructEventFn
        }
      }) as unknown as ReturnType<StripeWebhookDeps["getStripe"]>
  };
}

function makeRequest(
  body: string,
  headers: Record<string, string> = {}
): Request {
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

// ─── Tests ───────────────────────────────────────────────────────────────────

test("stripe webhook: returns 400 when STRIPE_WEBHOOK_SECRET is not set", async () => {
  delete process.env.STRIPE_WEBHOOK_SECRET;
  const req = makeRequest("{}", { "stripe-signature": "t=123,v1=abc" });
  const deps = makeStripeDep(() => { throw new Error("should not be called"); });

  const res = await handleStripeWebhookRequest(req, deps);
  assert.equal(res.status, 400);
  const body = await jsonBody(res);
  assert.ok(body.error, "should return error field");
});

test("stripe webhook: returns 400 when stripe-signature header is missing", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  const req = makeRequest("{}"); // no stripe-signature header
  const deps = makeStripeDep(() => { throw new Error("should not be called"); });

  const res = await handleStripeWebhookRequest(req, deps);
  assert.equal(res.status, 400);
  const body = await jsonBody(res);
  assert.ok(body.error);

  delete process.env.STRIPE_WEBHOOK_SECRET;
});

test("stripe webhook: returns 400 when constructEvent throws (invalid signature)", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  const req = makeRequest("{}", { "stripe-signature": "t=0,v1=bad" });
  const deps = makeStripeDep(() => {
    throw new Error("No signatures found matching the expected signature for payload.");
  });

  const res = await handleStripeWebhookRequest(req, deps);
  assert.equal(res.status, 400);
  const body = await jsonBody(res);
  assert.match(String(body.error), /signature/i);

  delete process.env.STRIPE_WEBHOOK_SECRET;
});

test("stripe webhook: returns 200 for checkout.session.completed", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  const req = makeRequest("{}", { "stripe-signature": "t=1,v1=valid" });
  const deps = makeStripeDep(() => ({
    type: "checkout.session.completed",
    id: "evt_checkout_1"
  }));

  const res = await handleStripeWebhookRequest(req, deps);
  assert.equal(res.status, 200);
  const body = await jsonBody(res);
  assert.equal(body.received, true);

  delete process.env.STRIPE_WEBHOOK_SECRET;
});

test("stripe webhook: returns 200 for customer.subscription.created", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  const req = makeRequest("{}", { "stripe-signature": "t=1,v1=valid" });
  const deps = makeStripeDep(() => ({
    type: "customer.subscription.created",
    id: "evt_sub_created"
  }));

  const res = await handleStripeWebhookRequest(req, deps);
  assert.equal(res.status, 200);
  assert.equal((await jsonBody(res)).received, true);

  delete process.env.STRIPE_WEBHOOK_SECRET;
});

test("stripe webhook: returns 200 for customer.subscription.updated", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  const req = makeRequest("{}", { "stripe-signature": "t=1,v1=valid" });
  const deps = makeStripeDep(() => ({
    type: "customer.subscription.updated",
    id: "evt_sub_updated"
  }));

  const res = await handleStripeWebhookRequest(req, deps);
  assert.equal(res.status, 200);

  delete process.env.STRIPE_WEBHOOK_SECRET;
});

test("stripe webhook: returns 200 for customer.subscription.deleted", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  const req = makeRequest("{}", { "stripe-signature": "t=1,v1=valid" });
  const deps = makeStripeDep(() => ({
    type: "customer.subscription.deleted",
    id: "evt_sub_deleted"
  }));

  const res = await handleStripeWebhookRequest(req, deps);
  assert.equal(res.status, 200);

  delete process.env.STRIPE_WEBHOOK_SECRET;
});

test("stripe webhook: returns 200 for invoice.payment_succeeded", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  const req = makeRequest("{}", { "stripe-signature": "t=1,v1=valid" });
  const deps = makeStripeDep(() => ({
    type: "invoice.payment_succeeded",
    id: "evt_inv_ok"
  }));

  const res = await handleStripeWebhookRequest(req, deps);
  assert.equal(res.status, 200);

  delete process.env.STRIPE_WEBHOOK_SECRET;
});

test("stripe webhook: returns 200 for invoice.payment_failed", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  const req = makeRequest("{}", { "stripe-signature": "t=1,v1=valid" });
  const deps = makeStripeDep(() => ({
    type: "invoice.payment_failed",
    id: "evt_inv_fail"
  }));

  const res = await handleStripeWebhookRequest(req, deps);
  assert.equal(res.status, 200);

  delete process.env.STRIPE_WEBHOOK_SECRET;
});

test("stripe webhook: returns 200 for unknown event type (no-op)", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  const req = makeRequest("{}", { "stripe-signature": "t=1,v1=valid" });
  const deps = makeStripeDep(() => ({
    type: "payment_intent.created",
    id: "evt_unknown"
  }));

  const res = await handleStripeWebhookRequest(req, deps);
  assert.equal(res.status, 200);
  assert.equal((await jsonBody(res)).received, true);

  delete process.env.STRIPE_WEBHOOK_SECRET;
});
