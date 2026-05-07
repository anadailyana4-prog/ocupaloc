/**
 * Unit tests for insertProgramareForProfSlug (PR 2: Atomic Booking).
 *
 * Tests the RPC call to book_appointment_atomic() and error_code mapping.
 * All Supabase interactions use stubs.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { SupabaseClient } from "@supabase/supabase-js";

import { insertProgramareForProfSlug } from "../src/lib/booking/insert-programare";

// ─── Stub Supabase Client ───────────────────────────────────────────────────

function makeAdmin(rpcResponse: {
  data?: Array<{
    success: boolean;
    programare_id: string;
    error_code: string | null;
    error_message: string | null;
  }>;
  error?: { code?: string; message?: string };
}): SupabaseClient {
  return {
    rpc: async () => rpcResponse
  } as unknown as SupabaseClient;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test("insertProgramareForProfSlug: success returns ok=true with programareId", async () => {
  const admin = makeAdmin({
    data: [
      {
        success: true,
        programare_id: "new-booking-uuid",
        error_code: null,
        error_message: null
      }
    ]
  });

  const result = await insertProgramareForProfSlug(admin, {
    slug: "test-salon",
    serviciuId: "service-uuid",
    dateStr: "2026-05-01",
    slotIso: "2026-05-01T10:00:00.000Z",
    numeClient: "Test Client",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, true);
  assert.equal((result as { ok: true; programareId: string }).programareId, "new-booking-uuid");
});

test("insertProgramareForProfSlug: PROFESIONIST_NOT_FOUND maps to 'Pagina nu există'", async () => {
  const admin = makeAdmin({
    data: [
      {
        success: false,
        programare_id: "",
        error_code: "PROFESIONIST_NOT_FOUND",
        error_message: "Profesionist not found"
      }
    ]
  });

  const result = await insertProgramareForProfSlug(admin, {
    slug: "no-such-salon",
    serviciuId: "service-uuid",
    dateStr: "2026-05-01",
    slotIso: "2026-05-01T10:00:00.000Z",
    numeClient: "Test Client",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  assert.match((result as { ok: false; message: string }).message, /nu există/i);
});

test("insertProgramareForProfSlug: SERVICE_NOT_FOUND maps to 'Serviciu invalid'", async () => {
  const admin = makeAdmin({
    data: [
      {
        success: false,
        programare_id: "",
        error_code: "SERVICE_NOT_FOUND",
        error_message: "Service not found"
      }
    ]
  });

  const result = await insertProgramareForProfSlug(admin, {
    slug: "salon",
    serviciuId: "no-such-service",
    dateStr: "2026-05-01",
    slotIso: "2026-05-01T10:00:00.000Z",
    numeClient: "Test Client",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  assert.match((result as { ok: false; message: string }).message, /serviciu/i);
});

test("insertProgramareForProfSlug: SLOT_CONFLICT maps to 'Slotul nu mai e disponibil'", async () => {
  const admin = makeAdmin({
    data: [
      {
        success: false,
        programare_id: "",
        error_code: "SLOT_CONFLICT",
        error_message: "Slot already booked"
      }
    ]
  });

  const result = await insertProgramareForProfSlug(admin, {
    slug: "salon",
    serviciuId: "service-uuid",
    dateStr: "2026-05-01",
    slotIso: "2026-05-01T10:00:00.000Z",
    numeClient: "Test Client",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  assert.match((result as { ok: false; message: string }).message, /disponibil/i);
});

test("insertProgramareForProfSlug: CLIENT_BLOCKED maps to 'sună direct'", async () => {
  const admin = makeAdmin({
    data: [
      {
        success: false,
        programare_id: "",
        error_code: "CLIENT_BLOCKED",
        error_message: "Client is blocked"
      }
    ]
  });

  const result = await insertProgramareForProfSlug(admin, {
    slug: "salon",
    serviciuId: "service-uuid",
    dateStr: "2026-05-01",
    slotIso: "2026-05-01T10:00:00.000Z",
    numeClient: "Test Client",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  assert.ok((result as { ok: false; message: string }).message.toLowerCase().includes("direct") || 
    (result as { ok: false; message: string }).message.toLowerCase().includes("rău"));
});

test("insertProgramareForProfSlug: NO_SUBSCRIPTION maps to 'Abonament inactiv'", async () => {
  const admin = makeAdmin({
    data: [
      {
        success: false,
        programare_id: "",
        error_code: "NO_SUBSCRIPTION",
        error_message: "No active subscription"
      }
    ]
  });

  const result = await insertProgramareForProfSlug(admin, {
    slug: "salon",
    serviciuId: "service-uuid",
    dateStr: "2026-05-01",
    slotIso: "2026-05-01T10:00:00.000Z",
    numeClient: "Test Client",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  assert.match((result as { ok: false; message: string }).message, /abonament|inactiv/i);
});

test("insertProgramareForProfSlug: SLOT_IN_PAST maps to 'Slot expirat'", async () => {
  const admin = makeAdmin({
    data: [
      {
        success: false,
        programare_id: "",
        error_code: "SLOT_IN_PAST",
        error_message: "Slot is in the past"
      }
    ]
  });

  const result = await insertProgramareForProfSlug(admin, {
    slug: "salon",
    serviciuId: "service-uuid",
    dateStr: "2026-05-01",
    slotIso: "2026-05-01T10:00:00.000Z",
    numeClient: "Test Client",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  assert.match((result as { ok: false; message: string }).message, /expirat/i);
});

test("insertProgramareForProfSlug: MIN_NOTICE_VIOLATION maps to 'minim...preaviz'", async () => {
  const admin = makeAdmin({
    data: [
      {
        success: false,
        programare_id: "",
        error_code: "MIN_NOTICE_VIOLATION",
        error_message: "Insufficient notice"
      }
    ]
  });

  const result = await insertProgramareForProfSlug(admin, {
    slug: "salon",
    serviciuId: "service-uuid",
    dateStr: "2026-05-01",
    slotIso: "2026-05-01T10:00:00.000Z",
    numeClient: "Test Client",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  assert.match((result as { ok: false; message: string }).message, /preaviz/i);
});

test("insertProgramareForProfSlug: MAX_FUTURE_VIOLATION maps to 'limita de programări'", async () => {
  const admin = makeAdmin({
    data: [
      {
        success: false,
        programare_id: "",
        error_code: "MAX_FUTURE_VIOLATION",
        error_message: "Too many future bookings"
      }
    ]
  });

  const result = await insertProgramareForProfSlug(admin, {
    slug: "salon",
    serviciuId: "service-uuid",
    dateStr: "2026-05-01",
    slotIso: "2026-05-01T10:00:00.000Z",
    numeClient: "Test Client",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  assert.match((result as { ok: false; message: string }).message, /limita/i);
});

test("insertProgramareForProfSlug: CANCEL_THRESHOLD_VIOLATION maps to 'Momentan nu poți rezerva'", async () => {
  const admin = makeAdmin({
    data: [
      {
        success: false,
        programare_id: "",
        error_code: "CANCEL_THRESHOLD_VIOLATION",
        error_message: "Too many cancellations"
      }
    ]
  });

  const result = await insertProgramareForProfSlug(admin, {
    slug: "salon",
    serviciuId: "service-uuid",
    dateStr: "2026-05-01",
    slotIso: "2026-05-01T10:00:00.000Z",
    numeClient: "Test Client",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  assert.match((result as { ok: false; message: string }).message, /online/i);
});

test("insertProgramareForProfSlug: unknown error_code returns generic message", async () => {
  const admin = makeAdmin({
    data: [
      {
        success: false,
        programare_id: "",
        error_code: "UNKNOWN_ERROR_123",
        error_message: "Unknown error"
      }
    ]
  });

  const result = await insertProgramareForProfSlug(admin, {
    slug: "salon",
    serviciuId: "service-uuid",
    dateStr: "2026-05-01",
    slotIso: "2026-05-01T10:00:00.000Z",
    numeClient: "Test Client",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  assert.match((result as { ok: false; message: string }).message, /nu am putut crea/i);
});

test("insertProgramareForProfSlug: RPC error returns sanitized generic message", async () => {
  const admin = makeAdmin({
    error: { code: "PGRST102", message: "The database returned an error" }
  });

  const result = await insertProgramareForProfSlug(admin, {
    slug: "salon",
    serviciuId: "service-uuid",
    dateStr: "2026-05-01",
    slotIso: "2026-05-01T10:00:00.000Z",
    numeClient: "Test Client",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  assert.match((result as { ok: false; message: string }).message, /nu am putut crea/i);
});

test("insertProgramareForProfSlug: no data in RPC response returns generic message", async () => {
  const admin = makeAdmin({});

  const result = await insertProgramareForProfSlug(admin, {
    slug: "salon",
    serviciuId: "service-uuid",
    dateStr: "2026-05-01",
    slotIso: "2026-05-01T10:00:00.000Z",
    numeClient: "Test Client",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  assert.match((result as { ok: false; message: string }).message, /nu am putut crea/i);
});

test("insertProgramareForProfSlug: exception during RPC call returns generic message", async () => {
  const admin = {
    rpc: async () => {
      throw new Error("Network timeout");
    }
  } as unknown as SupabaseClient;

  const result = await insertProgramareForProfSlug(admin, {
    slug: "salon",
    serviciuId: "service-uuid",
    dateStr: "2026-05-01",
    slotIso: "2026-05-01T10:00:00.000Z",
    numeClient: "Test Client",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  assert.match((result as { ok: false; message: string }).message, /nu am putut crea/i);
});

test("insertProgramareForProfSlug: trims phone and name inputs", async () => {
  let capturedArgs: Record<string, unknown> = {};
  const admin = {
    rpc: async (_name: string, args: Record<string, unknown>) => {
      capturedArgs = args;
      return {
        data: [
          {
            success: true,
            programare_id: "booking-uuid",
            error_code: null,
            error_message: null
          }
        ]
      };
    }
  } as unknown as SupabaseClient;

  const result = await insertProgramareForProfSlug(admin, {
    slug: "salon",
    serviciuId: "service-uuid",
    dateStr: "2026-05-01",
    slotIso: "2026-05-01T10:00:00.000Z",
    numeClient: "  Test Client  ",
    telefonClient: "  0712345678  ",
    emailClient: "  test@example.com  "
  });

  assert.equal(result.ok, true);
  assert.equal(capturedArgs.p_client_phone, "+40712345678");
  assert.equal(capturedArgs.p_client_name, "Test Client");
  assert.equal(capturedArgs.p_client_email, "test@example.com");
});

test("insertProgramareForProfSlug: blocked client rejects normalized phone variants consistently", async () => {
  const admin = {
    rpc: async (_name: string, args: Record<string, unknown>) => {
      const phone = String(args.p_client_phone ?? "");
      if (phone === "+40712345678") {
        return {
          data: [
            {
              success: false,
              programare_id: "",
              error_code: "CLIENT_BLOCKED",
              error_message: "Client is blocked"
            }
          ]
        };
      }

      return {
        data: [
          {
            success: true,
            programare_id: "booking-uuid",
            error_code: null,
            error_message: null
          }
        ]
      };
    }
  } as unknown as SupabaseClient;

  const baseInput = {
    slug: "salon",
    serviciuId: "service-uuid",
    dateStr: "2026-05-01",
    slotIso: "2026-05-01T10:00:00.000Z",
    numeClient: "Test Client"
  };

  const first = await insertProgramareForProfSlug(admin, {
    ...baseInput,
    telefonClient: "0712345678"
  });
  const second = await insertProgramareForProfSlug(admin, {
    ...baseInput,
    telefonClient: "40712345678"
  });
  const third = await insertProgramareForProfSlug(admin, {
    ...baseInput,
    telefonClient: "+40 712 345 678"
  });

  assert.equal(first.ok, false);
  assert.equal(second.ok, false);
  assert.equal(third.ok, false);
  assert.match((first as { ok: false; message: string }).message, /sună direct|Ne pare rău/i);
  assert.match((second as { ok: false; message: string }).message, /sună direct|Ne pare rău/i);
  assert.match((third as { ok: false; message: string }).message, /sună direct|Ne pare rău/i);
});

test("insertProgramareForProfSlug: null email is converted to empty string", async () => {
  let capturedEmail: unknown = "SENTINEL";
  const admin = {
    rpc: async (_name: string, args: Record<string, unknown>) => {
      capturedEmail = args.p_client_email;
      return {
        data: [
          {
            success: true,
            programare_id: "booking-uuid",
            error_code: null,
            error_message: null
          }
        ]
      };
    }
  } as unknown as SupabaseClient;

  await insertProgramareForProfSlug(admin, {
    slug: "salon",
    serviciuId: "service-uuid",
    dateStr: "2026-05-01",
    slotIso: "2026-05-01T10:00:00.000Z",
    numeClient: "Test Client",
    telefonClient: "0712345678",
    emailClient: null
  });

  assert.equal(capturedEmail, "");
});
