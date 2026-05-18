import assert from "node:assert/strict";
import test from "node:test";

import { env, getCriticalServerKeys } from "../src/lib/config/env";
import { getStripePriceId } from "../src/lib/billing/config";

function withEnv<T>(overrides: Record<string, string | undefined>, run: () => T): T {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(overrides)) {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return run();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("env.get throws for missing critical key", () => {
  withEnv({ RESEND_API_KEY: undefined }, () => {
    assert.throws(() => env.get("RESEND_API_KEY"), /Missing RESEND_API_KEY/);
  });
});

const baseCriticalEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role",
  RESEND_API_KEY: "re_123",
  RESEND_FROM: "noreply@example.com",
  REMINDERS_CRON_SECRET: "cron-secret"
};

test("env.assertCriticalServerEnv validates critical keys when billing disabled", () => {
  withEnv(
    {
      ...baseCriticalEnv,
      BILLING_ENABLED: "false",
      STRIPE_WEBHOOK_SECRET: undefined
    },
    () => {
      assert.doesNotThrow(() => env.assertCriticalServerEnv());
      assert.equal(
        getCriticalServerKeys().includes("STRIPE_WEBHOOK_SECRET"),
        false
      );
    }
  );
});

test("env.assertCriticalServerEnv requires Stripe webhook when billing enabled", () => {
  withEnv(
    {
      ...baseCriticalEnv,
      BILLING_ENABLED: "true",
      STRIPE_WEBHOOK_SECRET: undefined
    },
    () => {
      assert.throws(() => env.assertCriticalServerEnv(), /Missing STRIPE_WEBHOOK_SECRET/);
    }
  );
});

test("env.assertCriticalServerEnv validates all keys when billing enabled", () => {
  withEnv(
    {
      ...baseCriticalEnv,
      BILLING_ENABLED: "true",
      STRIPE_WEBHOOK_SECRET: "whsec_123"
    },
    () => {
      assert.doesNotThrow(() => env.assertCriticalServerEnv());
    }
  );
});

test("billing config reads STRIPE_PRICE_ID from central env accessor", () => {
  withEnv({ STRIPE_PRICE_ID: "price_live_123" }, () => {
    assert.equal(getStripePriceId(), "price_live_123");
  });
});