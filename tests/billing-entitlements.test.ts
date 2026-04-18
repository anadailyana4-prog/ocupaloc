import assert from "node:assert/strict";
import test from "node:test";

import type { SupabaseClient } from "@supabase/supabase-js";

import { checkBookingEntitlement } from "../src/lib/billing/entitlements";

function makeAdmin(subscription: { status: string; trial_end: string | null } | null, error: { message: string } | null = null): SupabaseClient {
  const chain = {
    select() {
      return chain;
    },
    eq() {
      return chain;
    },
    maybeSingle: async () => ({ data: subscription, error })
  };

  return {
    from: () => chain
  } as unknown as SupabaseClient;
}

test("checkBookingEntitlement denies booking for non-eligible status after trial", async () => {
  const previous = process.env.BILLING_ENABLED;
  process.env.BILLING_ENABLED = "true";

  const oldCreatedAt = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
  const admin = makeAdmin({ status: "past_due", trial_end: null });

  const result = await checkBookingEntitlement(admin, "11111111-1111-4111-8111-111111111111", oldCreatedAt);
  assert.equal(result.allowed, false);
  assert.match(result.reason, /Abonamentul nu este activ/i);

  process.env.BILLING_ENABLED = previous;
});
