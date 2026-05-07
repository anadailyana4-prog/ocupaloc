import assert from "node:assert/strict";
import test from "node:test";

import type { SupabaseClient } from "@supabase/supabase-js";

import { processStripeWebhookEvent } from "../src/lib/billing/stripe-webhook-service";

type WebhookRow = {
  id: string;
  stripe_event_id: string;
  event_type: string;
  status: "pending" | "processed" | "failed";
  payload: Record<string, unknown>;
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
};

function createAdmin(): SupabaseClient {
  const rows = new Map<string, WebhookRow>();

  return {
    from: (table: string) => {
      assert.equal(table, "webhook_events");

      return {
        select: () => ({
          eq: (_column: string, value: string) => ({
            maybeSingle: async () => ({
              data: rows.get(value) ?? null,
              error: null
            })
          })
        }),
        insert: (payload: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              const row: WebhookRow = {
                id: `row-${rows.size + 1}`,
                stripe_event_id: String(payload.stripe_event_id),
                event_type: String(payload.event_type),
                status: "pending",
                payload: payload.payload as Record<string, unknown>,
                error_message: null,
                received_at: new Date().toISOString(),
                processed_at: null
              };
              rows.set(row.stripe_event_id, row);
              return { data: row, error: null };
            }
          })
        }),
        update: (payload: Record<string, unknown>) => ({
          eq: async (_column: string, value: string) => {
            const existing = Array.from(rows.values()).find((row) => row.id === value);
            assert.ok(existing, `missing webhook row ${value}`);
            Object.assign(existing, payload);
            return { error: null };
          }
        })
      };
    }
  } as unknown as SupabaseClient;
}

test("processStripeWebhookEvent treats duplicate event as idempotent and only processes business effect once", async () => {
  const admin = createAdmin();
  const stripe = {} as never;
  const event = {
    id: "evt_same_1",
    type: "invoice.paid",
    data: { object: {} }
  } as never;

  let businessEffectCount = 0;

  const result1 = await processStripeWebhookEvent(stripe, admin, event, {
    processBusinessEvent: async () => {
      businessEffectCount += 1;
    },
    recordOperationalEvent: async () => undefined
  });

  const result2 = await processStripeWebhookEvent(stripe, admin, event, {
    processBusinessEvent: async () => {
      businessEffectCount += 1;
    },
    recordOperationalEvent: async () => undefined
  });

  assert.equal(result1.replayed, false);
  assert.equal(result2.replayed, true);
  assert.equal(businessEffectCount, 1);
});