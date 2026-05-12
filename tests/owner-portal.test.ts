import { describe, it, expect, vi, beforeEach } from "vitest";

describe("owner access control", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("blocks non-owner on owner stats endpoint", async () => {
    vi.doMock("@/lib/owner/auth", () => ({
      requireOwnerAdminFromRequest: vi.fn(async () => {
        throw new Error("Forbidden");
      }),
      logOwnerAction: vi.fn(async () => undefined)
    }));

    vi.doMock("@/lib/owner/data", () => ({
      getOwnerKpis: vi.fn(async () => ({}))
    }));

    const { GET } = await import("@/app/api/owner/stats/route");
    const response = await GET(new Request("https://ocupaloc.ro/api/owner/stats"));

    expect(response.status).toBe(403);
  });
});

describe("owner stats api", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns KPI payload for authorized owner", async () => {
    const logOwnerAction = vi.fn(async () => undefined);

    vi.doMock("@/lib/owner/auth", () => ({
      requireOwnerAdminFromRequest: vi.fn(async () => ({
        admin: { id: "adm-1", user_id: "u1", role: "owner", is_active: true, created_at: new Date().toISOString() },
        userId: "u1",
        ipAddress: "127.0.0.1",
        userAgent: "test"
      })),
      logOwnerAction
    }));

    vi.doMock("@/lib/owner/data", () => ({
      getOwnerKpis: vi.fn(async () => ({
        totalAccounts: 10,
        activeAccounts: 5,
        trialActive: 3,
        trialExpired: 1,
        subscriptionsActive: 5,
        subscriptionsCanceled: 2,
        mrrRon: 299.95,
        monthlyRevenueRon: 299.95,
        arrRon: 3599.4,
        totalBusinesses: 10,
        bookingsTotal: 120,
        bookings24h: 4,
        bookings7d: 20,
        bookings30d: 60,
        trialToPaidConversionPct: 62.5,
        bookingsPerDay: 2,
        bookingsPerWeek: 14,
        bookingsPerMonth: 60,
        cronSuccess24h: 9,
        cronFail24h: 1,
        emailsSent24h: 30,
        emailsFailed24h: 2,
        bookingErrorRate7dPct: 4.2,
        recentCriticalErrors: [],
        syntheticMonitorStatus: "healthy",
        deploymentStatus: "not_instrumented_yet",
        notInstrumented: []
      }))
    }));

    const { GET } = await import("@/app/api/owner/stats/route");
    const response = await GET(new Request("https://ocupaloc.ro/api/owner/stats"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.stats.totalAccounts).toBe(10);
    expect(logOwnerAction).toHaveBeenCalled();
  });
});

describe("owner sensitive actions", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("rejects cancel subscription without explicit confirmation", async () => {
    const logOwnerAction = vi.fn(async () => undefined);

    vi.doMock("@/lib/owner/auth", () => ({
      requireOwnerAdminFromRequest: vi.fn(async () => ({
        admin: { id: "adm-1", user_id: "u1", role: "owner", is_active: true, created_at: new Date().toISOString() },
        userId: "u1",
        ipAddress: "127.0.0.1",
        userAgent: "test"
      })),
      logOwnerAction
    }));

    vi.doMock("@/lib/supabase/admin", () => ({
      createSupabaseServiceClient: vi.fn()
    }));

    vi.doMock("@/lib/billing/stripe", () => ({
      getStripeClient: vi.fn()
    }));

    const { POST } = await import("@/app/api/owner/subscriptions/cancel/route");
    const response = await POST(
      new Request("https://ocupaloc.ro/api/owner/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profesionistId: "prof-1", confirmationText: "NO" })
      })
    );

    const payload = await response.json();
    expect(response.status).toBe(400);
    expect(String(payload.error)).toContain("Explicit confirmation required");
    expect(logOwnerAction).not.toHaveBeenCalled();
  });

  it("cancels with confirmation and writes audit", async () => {
    const logOwnerAction = vi.fn(async () => undefined);
    const cancel = vi.fn(async () => ({}));
    const updateEq = vi.fn(async () => ({ error: null }));

    vi.doMock("@/lib/owner/auth", () => ({
      requireOwnerAdminFromRequest: vi.fn(async () => ({
        admin: { id: "adm-1", user_id: "u1", role: "owner", is_active: true, created_at: new Date().toISOString() },
        userId: "u1",
        ipAddress: "127.0.0.1",
        userAgent: "test"
      })),
      logOwnerAction
    }));

    vi.doMock("@/lib/supabase/admin", () => ({
      createSupabaseServiceClient: () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => ({
                    data: {
                      id: "sub-local-1",
                      stripe_subscription_id: "sub_123",
                      status: "active"
                    },
                    error: null
                  })
                })
              })
            })
          }),
          update: () => ({
            eq: updateEq
          })
        })
      })
    }));

    vi.doMock("@/lib/billing/stripe", () => ({
      getStripeClient: () => ({
        subscriptions: { cancel }
      })
    }));

    const { POST } = await import("@/app/api/owner/subscriptions/cancel/route");
    const response = await POST(
      new Request("https://ocupaloc.ro/api/owner/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profesionistId: "prof-1",
          confirmationText: "CONFIRM_CANCEL",
          reason: "customer requested"
        })
      })
    );

    expect(response.status).toBe(200);
    expect(cancel).toHaveBeenCalledWith("sub_123", { prorate: false });
    expect(updateEq).toHaveBeenCalledWith("id", "sub-local-1");
    expect(logOwnerAction).toHaveBeenCalled();
  });
});

describe("owner KPI sanity", () => {
  it("derives conversion and revenue metrics consistently", async () => {
    vi.resetModules();
    vi.doUnmock("@/lib/owner/data");
    const { deriveOwnerKpiMetrics } = await import("@/lib/owner/data");

    const result = deriveOwnerKpiMetrics({
      activeSubs: 10,
      trialActive: 5,
      bookings30d: 90
    });

    expect(result.mrrRon).toBe(599.9);
    expect(result.arrRon).toBe(7198.8);
    expect(result.trialToPaidConversionPct).toBeCloseTo(66.67, 2);
    expect(result.bookingsPerDay).toBe(3);
    expect(result.bookingsPerMonth).toBe(90);
  });
});
