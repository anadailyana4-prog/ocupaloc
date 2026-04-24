/**
 * Unit tests for smart rules inside insertProgramareForProfSlug.
 *
 * All Supabase interactions are replaced with in-memory stub objects
 * that mimic the chainable builder API used in the production code.
 * Tests focus on the guard clauses that don't require slot computation.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { SupabaseClient } from "@supabase/supabase-js";

import { insertProgramareForProfSlug } from "../src/lib/booking/insert-programare";

// ─── Minimal Supabase chain builder ─────────────────────────────────────────

type ChainResult = { data: unknown; error: unknown; count?: number };

/**
 * Creates a Supabase stub where each table name maps to a response object.
 * Supports .select().eq()...maybeSingle() / .single() / count-style queries.
 */
function makeAdmin(tables: Record<string, ChainResult>): SupabaseClient {
  function chain(result: ChainResult): Record<string, unknown> {
    const terminal = {
      maybeSingle: async () => result,
      single: async () => result,
      // make it thenable so `await admin.from(...).insert(...).select(...).single()` works
      then: (resolve: (v: unknown) => void) => resolve(result)
    };
    const proxy: Record<string, unknown> = new Proxy(terminal, {
      get(target, prop) {
        if (prop in target) return (target as Record<string | symbol, unknown>)[prop];
        // Any unknown method on the chain returns the same chain again
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return (..._: unknown[]) => proxy;
      }
    });
    return proxy;
  }

  return {
    from: (table: string) => {
      const result = tables[table] ?? { data: null, error: null };
      return chain(result);
    },
    rpc: async () => ({ data: null, error: null })
  } as unknown as SupabaseClient;
}

// Shared base profesionist profile used across tests
const BASE_PROF = {
  id: "prof-uuid-1",
  slug: "test-salon",
  telefon: "0712345678",
  program: {
    luni: ["09:00", "18:00"],
    marti: ["09:00", "18:00"],
    miercuri: ["09:00", "18:00"],
    joi: ["09:00", "18:00"],
    vineri: ["09:00", "18:00"],
    sambata: [],
    duminica: []
  },
  pauza_intre_clienti: 0,
  lucreaza_acasa: false,
  timp_pregatire: 0,
  smart_rules_enabled: false,
  smart_min_notice_minutes: 0,
  smart_max_future_bookings: 0,
  smart_client_cancel_threshold: 0,
  smart_cancel_window_days: 60,
  created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() // 10 days ago (within trial)
};

const BASE_SERVICIU = {
  id: "svc-uuid-1",
  durata_minute: 60,
  nume: "Tuns",
  activ: true,
  profesionist_id: "prof-uuid-1"
};

function nextBookableSlotIso(): string {
  const d = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  while (d.getDay() !== 1) {
    d.setDate(d.getDate() + 1);
  }
  d.setUTCHours(7, 0, 0, 0);
  return d.toISOString();
}

const FUTURE_SLOT = nextBookableSlotIso();
const FUTURE_DATE = FUTURE_SLOT.slice(0, 10);

// ─── Tests ──────────────────────────────────────────────────────────────────

test("insertProgramareForProfSlug: returns error when prof not found", async () => {
  const admin = makeAdmin({
    profesionisti: { data: null, error: { message: "not found" } }
  });

  const result = await insertProgramareForProfSlug(admin, {
    slug: "no-such-salon",
    serviciuId: BASE_SERVICIU.id,
    dateStr: FUTURE_DATE,
    slotIso: FUTURE_SLOT,
    numeClient: "Test Client",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  assert.match((result as { ok: false; message: string }).message, /nu există/i);
});

test("insertProgramareForProfSlug: blocked client returns salon-phone message", async () => {
  const admin = makeAdmin({
    profesionisti: { data: BASE_PROF, error: null },
    clienti_blocati: { data: { id: "block-1" }, error: null }
  });

  const result = await insertProgramareForProfSlug(admin, {
    slug: BASE_PROF.slug,
    serviciuId: BASE_SERVICIU.id,
    dateStr: FUTURE_DATE,
    slotIso: FUTURE_SLOT,
    numeClient: "Client Blocat",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  const msg = (result as { ok: false; message: string }).message;
  assert.ok(
    msg.includes("sună") || msg.includes("Ne pare rău"),
    `expected blocked message, got: ${msg}`
  );
});

test("insertProgramareForProfSlug: past slot returns expired message", async () => {
  const admin = makeAdmin({
    profesionisti: { data: BASE_PROF, error: null },
    clienti_blocati: { data: null, error: null }
  });

  const pastSlot = new Date(Date.now() - 3600 * 1000).toISOString();
  const result = await insertProgramareForProfSlug(admin, {
    slug: BASE_PROF.slug,
    serviciuId: BASE_SERVICIU.id,
    dateStr: pastSlot.slice(0, 10),
    slotIso: pastSlot,
    numeClient: "Client Test",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  assert.match((result as { ok: false; message: string }).message, /expirat|viitoare/i);
});

test("insertProgramareForProfSlug: smart_rules min_notice_minutes blocks too-soon slot", async () => {
  const prof = {
    ...BASE_PROF,
    smart_rules_enabled: true,
    smart_min_notice_minutes: 120 // 2h advance required
  };
  const admin = makeAdmin({
    profesionisti: { data: prof, error: null },
    clienti_blocati: { data: null, error: null }
  });

  // Slot that's only 30 minutes in the future (less than the 120-min required)
  const tooSoonSlot = new Date(Date.now() + 30 * 60_000).toISOString();

  const result = await insertProgramareForProfSlug(admin, {
    slug: prof.slug,
    serviciuId: BASE_SERVICIU.id,
    dateStr: tooSoonSlot.slice(0, 10),
    slotIso: tooSoonSlot,
    numeClient: "Client Test",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  const msg = (result as { ok: false; message: string }).message;
  assert.ok(msg.includes("minim"), `expected notice message, got: ${msg}`);
});

test("insertProgramareForProfSlug: smart_rules max_future_bookings blocks when limit reached", async () => {
  const prof = {
    ...BASE_PROF,
    smart_rules_enabled: true,
    smart_max_future_bookings: 1
  };

  // Programari table returns count=1 (limit reached)
  const adminTables: Record<string, ChainResult> = {
    profesionisti: { data: prof, error: null },
    clienti_blocati: { data: null, error: null },
    programari: { data: null, error: null, count: 1 }
  };
  const admin = makeAdmin(adminTables);

  const result = await insertProgramareForProfSlug(admin, {
    slug: prof.slug,
    serviciuId: BASE_SERVICIU.id,
    dateStr: FUTURE_DATE,
    slotIso: FUTURE_SLOT,
    numeClient: "Client Test",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  const msg = (result as { ok: false; message: string }).message;
  assert.ok(msg.toLowerCase().includes("limita") || msg.toLowerCase().includes("limit"), `expected limit message, got: ${msg}`);
});

test("insertProgramareForProfSlug: smart_rules cancel threshold blocks repeat-canceller", async () => {
  const prof = {
    ...BASE_PROF,
    smart_rules_enabled: true,
    smart_client_cancel_threshold: 2,
    smart_cancel_window_days: 30
  };

  // programari_status_events returns 2 events → 2 unique booking IDs
  // programari returns count=2 (both match the phone)
  const eventsData = [
    { programare_id: "p-1" },
    { programare_id: "p-2" }
  ];

  const adminTables: Record<string, ChainResult> = {
    profesionisti: { data: prof, error: null },
    clienti_blocati: { data: null, error: null },
    programari: { data: null, error: null, count: 2 },
    programari_status_events: { data: eventsData, error: null }
  };
  const admin = makeAdmin(adminTables);

  const result = await insertProgramareForProfSlug(admin, {
    slug: prof.slug,
    serviciuId: BASE_SERVICIU.id,
    dateStr: FUTURE_DATE,
    slotIso: FUTURE_SLOT,
    numeClient: "Client Test",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  const msg = (result as { ok: false; message: string }).message;
  assert.ok(
    msg.toLowerCase().includes("online") || msg.toLowerCase().includes("contactezi"),
    `expected cancel-threshold message, got: ${msg}`
  );
});

test("insertProgramareForProfSlug: invalid service returns service error", async () => {
  const admin = makeAdmin({
    profesionisti: { data: BASE_PROF, error: null },
    clienti_blocati: { data: null, error: null },
    servicii: { data: null, error: { message: "not found" } },
    programari: { data: [], error: null }
  });

  const result = await insertProgramareForProfSlug(admin, {
    slug: BASE_PROF.slug,
    serviciuId: "00000000-0000-0000-0000-000000000000",
    dateStr: FUTURE_DATE,
    slotIso: FUTURE_SLOT,
    numeClient: "Client Test",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  assert.match((result as { ok: false; message: string }).message, /serviciu/i);
});

test("insertProgramareForProfSlug: slot unavailable returns conflict message", async () => {
  // Use a far-future date so we're definitely past the "past slot" guard
  const farFuture = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  // Find the luni date
  while (farFuture.getDay() !== 1) {
    farFuture.setDate(farFuture.getDate() + 1);
  }
  farFuture.setUTCHours(7, 0, 0, 0); // 09:00 EET (UTC+2) or 06:00 EEST (UTC+3)
  const slotIso = farFuture.toISOString();
  const dateStr = slotIso.slice(0, 10);

  // Occupied: the entire 09:00–18:00 window (UTC 07:00–16:00 in winter)
  const ocupateStart = new Date(farFuture);
  ocupateStart.setUTCHours(6, 0, 0, 0);
  const ocupateEnd = new Date(farFuture);
  ocupateEnd.setUTCHours(16, 0, 0, 0);

  const admin = makeAdmin({
    profesionisti: { data: BASE_PROF, error: null },
    clienti_blocati: { data: null, error: null },
    servicii: { data: BASE_SERVICIU, error: null },
    programari: {
      data: [
        {
          data_start: ocupateStart.toISOString(),
          data_final: ocupateEnd.toISOString(),
          status: "confirmat"
        }
      ],
      error: null
    }
  });

  const result = await insertProgramareForProfSlug(admin, {
    slug: BASE_PROF.slug,
    serviciuId: BASE_SERVICIU.id,
    dateStr,
    slotIso,
    numeClient: "Client Test",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  assert.match((result as { ok: false; message: string }).message, /disponibil|oră/i);
});

test("insertProgramareForProfSlug: 23P01 overlap is translated to Romanian conflict message", async () => {
  const slotIso = nextBookableSlotIso();
  const dateStr = slotIso.slice(0, 10);

  const admin = makeAdmin({
    profesionisti: { data: BASE_PROF, error: null },
    clienti_blocati: { data: null, error: null },
    servicii: { data: BASE_SERVICIU, error: null },
    programari: { data: null, error: { code: "23P01", message: "overlap constraint" } }
  });

  const result = await insertProgramareForProfSlug(admin, {
    slug: BASE_PROF.slug,
    serviciuId: BASE_SERVICIU.id,
    dateStr,
    slotIso,
    numeClient: "Client Test",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  assert.match((result as { ok: false; message: string }).message, /slotul nu mai e disponibil/i);
});

test("insertProgramareForProfSlug: unknown insert errors are sanitized for public users", async () => {
  const slotIso = nextBookableSlotIso();
  const dateStr = slotIso.slice(0, 10);

  const admin = makeAdmin({
    profesionisti: { data: BASE_PROF, error: null },
    clienti_blocati: { data: null, error: null },
    servicii: { data: BASE_SERVICIU, error: null },
    programari: { data: null, error: { code: "23505", message: "duplicate key value violates unique constraint public.secret_internal" } }
  });

  const result = await insertProgramareForProfSlug(admin, {
    slug: BASE_PROF.slug,
    serviciuId: BASE_SERVICIU.id,
    dateStr,
    slotIso,
    numeClient: "Client Test",
    telefonClient: "0712345678"
  });

  assert.equal(result.ok, false);
  const msg = (result as { ok: false; message: string }).message;
  assert.match(msg, /nu am putut crea programarea/i);
  assert.equal(msg.includes("public.secret_internal"), false);
});
