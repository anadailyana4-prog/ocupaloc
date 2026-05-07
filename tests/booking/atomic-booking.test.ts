import assert from "node:assert/strict";
import test from "node:test";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createBookingAtomic } from "../../src/lib/booking/insert-programare";

test("prevents double booking with atomic transaction", async () => {
  const bookings: Array<{ slot: string; id: string }> = [];

  const admin = {
    rpc: async (_name: string, args: Record<string, string>) => {
      const slot = `${args.p_profesionist_id}:${args.p_serviciu_id}:${args.p_data_start}:${args.p_data_final}`;
      const existing = bookings.find((booking) => booking.slot === slot);

      if (existing) {
        return {
          data: null,
          error: { message: "CONFLICT: Slot already booked" }
        };
      }

      const id = `booking-${bookings.length + 1}`;
      bookings.push({ slot, id });

      return {
        data: { programare_id: id, status: "confirmat" },
        error: null
      };
    }
  } as unknown as SupabaseClient;

  const result1 = await createBookingAtomic(
    admin,
    "prof-1",
    "srv-1",
    new Date("2026-05-01T10:00:00.000Z"),
    new Date("2026-05-01T11:00:00.000Z"),
    "0712345678",
    "Test Client",
    "client@example.com"
  );
  assert.equal(result1.ok, true);

  const result2 = await createBookingAtomic(
    admin,
    "prof-1",
    "srv-1",
    new Date("2026-05-01T10:00:00.000Z"),
    new Date("2026-05-01T11:00:00.000Z"),
    "0799999999",
    "Another Client",
    "another@example.com"
  );
  assert.equal(result2.ok, false);
  if (!result2.ok) {
    assert.equal(result2.error.code, "SLOT_CONFLICT");
  }

  assert.equal(bookings.length, 1);
});