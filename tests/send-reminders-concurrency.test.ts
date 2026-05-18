import { describe, it, expect, vi, beforeEach } from "vitest";

type ReminderRow = { id: string; profesionist_id: string };

function makeNextRequest(url: string): import("next/server").NextRequest {
  return {
    headers: new Headers({ authorization: "Bearer test-secret" }),
    nextUrl: new URL(url)
  } as unknown as import("next/server").NextRequest;
}

function createAdminStub(rows: ReminderRow[]) {
  const claimed = new Set<string>();

  return {
    from: (table: string) => {
      if (table === "programari") {
        const builder = {
          eq: () => builder,
          not: () => builder,
          or: () => builder,
          gte: () => builder,
          lte: () => builder,
          order: () => builder,
          limit: async () => ({ data: rows, error: null })
        };

        return {
          select: () => builder
        };
      }

      if (table === "programari_reminders") {
        return {
          select: () => ({
            limit: async () => ({ data: [], error: null })
          }),
          upsert: (payload: { programare_id: string; tip: string }) => ({
            select: async () => {
              const key = `${payload.programare_id}:${payload.tip}`;
              if (claimed.has(key)) {
                return { data: [], error: null };
              }

              claimed.add(key);
              return { data: [{ id: "claim-1" }], error: null };
            }
          }),
          delete: () => {
            let programareId: string | null = null;
            let tip: string | null = null;

            const secondEq = async (_field: string, value: string) => {
              tip = value;
              if (programareId && tip) {
                claimed.delete(`${programareId}:${tip}`);
              }
              return { data: null, error: null };
            };

            const firstEq = (_field: string, value: string) => {
              programareId = value;
              return {
                eq: secondEq
              };
            };

            return {
              eq: firstEq
            };
          }
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }
  };
}

describe("send-reminders concurrency", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("sends one reminder when two cron runs overlap for same booking+type", async () => {
    const notifyClientReminder = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
      return true;
    });

    const admin = createAdminStub([{ id: "booking-1", profesionist_id: "prof-1" }]);

    vi.doMock("@/lib/email/programare-notify", () => ({
      notifyClientReminder
    }));

    vi.doMock("@/lib/supabase/admin", () => ({
      createSupabaseServiceClient: () => admin
    }));

    vi.doMock("@/lib/cron-auth", () => ({
      validateCronSecret: () => true
    }));

    vi.doMock("@/lib/ops-events", () => ({
      getRequestId: () => "req-test",
      recordOperationalEvent: async () => undefined
    }));

    vi.doMock("@/lib/observability", () => ({
      reportError: vi.fn()
    }));

    const { GET } = await import("@/app/api/jobs/send-reminders/route");

    const reqA = makeNextRequest("https://ocupaloc.ro/api/jobs/send-reminders?type=24h");
    const reqB = makeNextRequest("https://ocupaloc.ro/api/jobs/send-reminders?type=24h");

    await Promise.all([GET(reqA), GET(reqB)]);

    expect(notifyClientReminder).toHaveBeenCalledTimes(1);
    expect(notifyClientReminder).toHaveBeenCalledWith("booking-1", "24h");
  });
});
