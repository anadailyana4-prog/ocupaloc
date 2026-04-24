import { describe, it, expect, vi } from "vitest";
import { checkBookingEntitlement } from "@/lib/billing/entitlements";
import { entitlementMessage } from "@/lib/billing/entitlement-messages";

vi.mock("@/lib/billing/config", () => ({
  isBillingEnabled: () => true,
  BILLING_TRIAL_DAYS: 14,
}));

function makeAdmin(subRow: Record<string, unknown> | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({
              maybeSingle: async () => ({ data: subRow }),
            }),
          }),
        }),
      }),
    }),
  } as unknown as import("@supabase/supabase-js").SupabaseClient;
}

const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const recentCreated = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
const oldCreated = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

describe("checkBookingEntitlement", () => {
  it("allows when billing disabled", async () => {
    vi.doMock("@/lib/billing/config", () => ({ isBillingEnabled: () => false, BILLING_TRIAL_DAYS: 14 }));
    const { checkBookingEntitlement: fn } = await import("@/lib/billing/entitlements");
    const r = await fn(makeAdmin(null), "prof1", recentCreated);
    expect(r.allowed).toBe(true);
  });

  it("allows active subscription with period in future", async () => {
    const r = await checkBookingEntitlement(makeAdmin({ status: "active", current_period_end: future, cancel_at_period_end: false }), "prof1", oldCreated);
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe("");
  });

  it("allows trialing subscription", async () => {
    const r = await checkBookingEntitlement(makeAdmin({ status: "trialing", current_period_end: future, cancel_at_period_end: false }), "prof1", oldCreated);
    expect(r.allowed).toBe(true);
  });

  it("denies incomplete subscription", async () => {
    const r = await checkBookingEntitlement(makeAdmin({ status: "incomplete", current_period_end: future, cancel_at_period_end: false }), "prof1", oldCreated);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("subscription_incomplete");
  });

  it("denies paused subscription", async () => {
    const r = await checkBookingEntitlement(makeAdmin({ status: "paused", current_period_end: future, cancel_at_period_end: false }), "prof1", oldCreated);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("subscription_paused");
  });

  it("allows past_due within 7-day grace period", async () => {
    const graceEnd = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const r = await checkBookingEntitlement(makeAdmin({ status: "past_due", current_period_end: graceEnd, cancel_at_period_end: false }), "prof1", oldCreated);
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe("grace_period");
  });

  it("denies past_due older than 7 days", async () => {
    const r = await checkBookingEntitlement(makeAdmin({ status: "past_due", current_period_end: past, cancel_at_period_end: false }), "prof1", oldCreated);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("subscription_past_due");
  });

  it("denies canceled subscription", async () => {
    const r = await checkBookingEntitlement(makeAdmin({ status: "canceled", current_period_end: past, cancel_at_period_end: true }), "prof1", oldCreated);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("subscription_canceled");
  });

  it("allows no-row account within trial (legacy_trial)", async () => {
    const r = await checkBookingEntitlement(makeAdmin(null), "prof1", recentCreated);
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe("legacy_trial");
  });

  it("denies no-row account past trial", async () => {
    const r = await checkBookingEntitlement(makeAdmin(null), "prof1", oldCreated);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("no_active_subscription");
  });
});

describe("entitlementMessage", () => {
  const denyReasons = [
    "subscription_past_due",
    "subscription_incomplete",
    "subscription_paused",
    "subscription_canceled",
    "no_active_subscription",
    "billing_error",
  ];

  for (const reason of denyReasons) {
    it(`returns non-empty Romanian string for reason: ${reason}`, () => {
      const msg = entitlementMessage(reason);
      expect(msg.length).toBeGreaterThan(10);
      expect(msg).toMatch(/[ăîâșțĂÎÂȘȚa-zA-Z]/);
    });
  }

  it("returns empty string for grace_period", () => {
    expect(entitlementMessage("grace_period")).toBe("");
  });

  it("returns empty string for legacy_trial", () => {
    expect(entitlementMessage("legacy_trial")).toBe("");
  });

  it("returns generic Romanian fallback for unknown reason", () => {
    const msg = entitlementMessage("some_unknown_reason_xyz");
    expect(msg.length).toBeGreaterThan(5);
  });
});
