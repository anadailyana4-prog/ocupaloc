import assert from "node:assert/strict";
import test from "node:test";

import { fromZonedTime, toZonedTime } from "date-fns-tz";

import { calcDataFinalProgramare, computeFreeSlots, type IntervalOccupat } from "../src/lib/slots";
import { getProgramSlotConfig } from "../src/lib/program";
import type { ProgramSaptamanal } from "../src/lib/program";

const TZ = "Europe/Bucharest";

// Bucharest is EET (UTC+2) in winter. Use November dates so all UTC offsets are +2.
// 2026-11-02 = Monday (luni) in EET.  2026-11-03 = Tuesday (marti).
const MONDAY = "2026-11-02";
const TUESDAY = "2026-11-03";

/** Build a UTC Date from a local Bucharest datetime string "YYYY-MM-DDTHH:mm:ss". */
function buc(localStr: string): Date {
  return fromZonedTime(localStr, TZ);
}

/** Return the local hour in Bucharest for a UTC Date. */
function bucHour(d: Date): number {
  return toZonedTime(d, TZ).getHours();
}

/** Return the local minutes in Bucharest for a UTC Date. */
function bucMinute(d: Date): number {
  return toZonedTime(d, TZ).getMinutes();
}

function makeProgram(overrides?: Partial<ProgramSaptamanal>): ProgramSaptamanal {
  return {
    luni: ["09:00", "18:00"],
    marti: ["09:00", "18:00"],
    miercuri: ["09:00", "18:00"],
    joi: ["09:00", "18:00"],
    vineri: ["09:00", "18:00"],
    sambata: [],
    duminica: [],
    ...overrides
  };
}

// ─── calcDataFinalProgramare ────────────────────────────────────────────────

test("calcDataFinalProgramare: first slot of day adds prep time", () => {
  const start = buc("2026-11-02T09:00:00"); // 09:00 Bucharest
  const end = calcDataFinalProgramare(start, 60, 10, 15, true);
  // 60 + 10 (buffer) + 15 (prep, first slot) = 85 min
  const diffMin = (end.getTime() - start.getTime()) / 60_000;
  assert.equal(diffMin, 85);
});

test("calcDataFinalProgramare: subsequent slot skips prep time", () => {
  const start = buc("2026-11-02T10:00:00");
  const end = calcDataFinalProgramare(start, 60, 10, 15, false);
  // 60 + 10 (buffer) + 0 (no prep) = 70 min
  const diffMin = (end.getTime() - start.getTime()) / 60_000;
  assert.equal(diffMin, 70);
});

test("calcDataFinalProgramare: zero extras", () => {
  const start = buc("2026-11-02T10:00:00");
  const end = calcDataFinalProgramare(start, 45, 0, 0, true);
  assert.equal((end.getTime() - start.getTime()) / 60_000, 45);
});

// ─── computeFreeSlots ──────────────────────────────────────────────────────

test("slot strategy fallback: existing profiles without metadata default to service_duration", () => {
  const cfg = getProgramSlotConfig(null);
  assert.equal(cfg.strategy, "service_duration");
});

test("computeFreeSlots: day off returns empty array", () => {
  const program = makeProgram({ sambata: [], duminica: [] });
  // 2026-11-07 is sambata
  const slots = computeFreeSlots("2026-11-07", program, 60, 0, 0, []);
  assert.equal(slots.length, 0);
});

test("computeFreeSlots: empty day with 60-min service yields service-aligned starts", () => {
  const program = makeProgram();
  const slots = computeFreeSlots(MONDAY, program, 60, 0, 0, []);
  // Last valid slot: 17:00 (17:00 + 60 = 18:00 = workEnd)
  assert.ok(slots.length > 0, "should have slots");
  for (const s of slots) {
    const h = bucHour(s);
    assert.ok(h >= 9, `slot hour ${h} is before 09:00`);
    assert.ok(h <= 17, `slot hour ${h} is after 17:00`);
  }
  assert.equal(bucHour(slots[0]!), 9);
  assert.equal(bucMinute(slots[0]!), 0);
  assert.equal(bucHour(slots[slots.length - 1]!), 17);
  assert.equal(bucMinute(slots[slots.length - 1]!), 0);
  // 9-hour workday / 60-min block = 9 starts
  assert.equal(slots.length, 9);
});

test("computeFreeSlots: pause between clients reduces number of slots", () => {
  const program = makeProgram();
  const withoutPause = computeFreeSlots(MONDAY, program, 60, 0, 0, []);
  const withPause = computeFreeSlots(MONDAY, program, 60, 15, 0, []);
  assert.ok(withPause.length < withoutPause.length, "pause should reduce available slots");
});

test("computeFreeSlots: daily configured break blocks slots in that period", () => {
  const program = makeProgram();
  const slots = computeFreeSlots(MONDAY, program, 30, 0, 0, [], { start: "13:00", durationMinutes: 60 });

  const has1300 = slots.some((s) => bucHour(s) === 13 && bucMinute(s) === 0);
  const has1315 = slots.some((s) => bucHour(s) === 13 && bucMinute(s) === 15);
  const has1245 = slots.some((s) => bucHour(s) === 12 && bucMinute(s) === 45);

  assert.equal(has1300, false, "13:00 should be blocked by break");
  assert.equal(has1315, false, "13:15 should be blocked by break");
  assert.equal(has1245, false, "12:45 should be blocked because service overlaps break");
});

test("computeFreeSlots: prep time applied only for first slot", () => {
  const program = makeProgram();
  // 30-min service, 0 pause, 30-min prep — first slot needs 60 min, later slots need 30 min
  const noPrep = computeFreeSlots(MONDAY, program, 30, 0, 0, []);
  const withPrep = computeFreeSlots(MONDAY, program, 30, 0, 30, []);
  // withPrep should have fewer slots because first slot is longer
  assert.ok(withPrep.length < noPrep.length, "prep should reduce slots");
  // Both should start at 09:00 since prep is for first-slot overhead
  const firstNoPrep = noPrep[0]!;
  const firstWithPrep = withPrep[0]!;
  assert.equal(firstNoPrep.getTime(), firstWithPrep.getTime(), "first slot time is same");
});

test("computeFreeSlots: occupied slot is excluded", () => {
  const program = makeProgram();
  // Book 10:00–11:00 Bucharest
  const occupied: IntervalOccupat[] = [
    {
      start: buc("2026-11-02T10:00:00"),
      end: buc("2026-11-02T11:00:00")
    }
  ];
  const slots = computeFreeSlots(MONDAY, program, 60, 0, 0, occupied);
  // No slot should overlap [10:00, 11:00)
  for (const s of slots) {
    const slotEnd = new Date(s.getTime() + 60 * 60_000);
    const overlaps =
      s.getTime() < occupied[0]!.end.getTime() &&
      slotEnd.getTime() > occupied[0]!.start.getTime();
    assert.equal(overlaps, false, `slot ${s.toISOString()} overlaps with occupied interval`);
  }
});

test("computeFreeSlots: fully booked day returns empty array", () => {
  const program = makeProgram({ luni: ["09:00", "10:00"] }); // 1-hour day
  // One 60-min booking fills the entire day
  const occupied: IntervalOccupat[] = [
    {
      start: buc("2026-11-02T09:00:00"),
      end: buc("2026-11-02T10:00:00")
    }
  ];
  const slots = computeFreeSlots(MONDAY, program, 60, 0, 0, occupied);
  assert.equal(slots.length, 0, "fully booked day should return no free slots");
});

test("computeFreeSlots: service too long for work window returns empty array", () => {
  const program = makeProgram({ luni: ["09:00", "09:30"] }); // 30-min window
  const slots = computeFreeSlots(MONDAY, program, 60, 0, 0, []);
  assert.equal(slots.length, 0, "60-min service cannot fit in 30-min window");
});

test("computeFreeSlots: two adjacent bookings leave gap correctly", () => {
  const program = makeProgram();
  // 10:00–11:00 and 12:00–13:00 booked (Bucharest)
  const occupied: IntervalOccupat[] = [
    {
      start: buc("2026-11-02T10:00:00"),
      end: buc("2026-11-02T11:00:00")
    },
    {
      start: buc("2026-11-02T12:00:00"),
      end: buc("2026-11-02T13:00:00")
    }
  ];
  const slots = computeFreeSlots(MONDAY, program, 60, 0, 0, occupied);
  // 11:00–12:00 gap: only one free 60-min slot (11:00 exactly)
  const gapSlots = slots.filter((s) => bucHour(s) === 11);
  assert.ok(gapSlots.length >= 1, "there should be at least one slot in the 11:00–12:00 gap");
  // No slot starting at 11:15 because 11:15+60=12:15 overlaps 12:00–13:00 booking
  const slotAt1115 = slots.find((s) => bucHour(s) === 11 && bucMinute(s) === 15);
  assert.equal(slotAt1115, undefined, "11:15 slot should not be available (would overlap 12:00 booking)");
});

test("computeFreeSlots: slots are returned in chronological order", () => {
  const program = makeProgram();
  const slots = computeFreeSlots(TUESDAY, program, 30, 0, 0, []);
  for (let i = 1; i < slots.length; i++) {
    assert.ok(
      slots[i]!.getTime() > slots[i - 1]!.getTime(),
      `slots[${i}] should be after slots[${i - 1}]`
    );
  }
});

test("computeFreeSlots: default interval follows service duration", () => {
  const program = makeProgram();
  const slots = computeFreeSlots(TUESDAY, program, 30, 0, 0, []);
  assert.ok(slots.length >= 2, "need at least 2 slots to verify interval");
  const diff = (slots[1]!.getTime() - slots[0]!.getTime()) / 60_000;
  assert.equal(diff, 30, "slots should follow service duration");
});

test("computeFreeSlots: duration-aligned steps for 15/30/45/60 min services", () => {
  const program = makeProgram();
  for (const duration of [15, 30, 45, 60]) {
    const slots = computeFreeSlots(TUESDAY, program, duration, 0, 0, []);
    assert.ok(slots.length >= 2, `need at least 2 slots for duration ${duration}`);
    const diff = (slots[1]!.getTime() - slots[0]!.getTime()) / 60_000;
    assert.equal(diff, duration, `slots should be ${duration} minutes apart`);
  }
});

test("computeFreeSlots: fixed-step strategy can override service alignment", () => {
  const program = makeProgram();
  const slots = computeFreeSlots(TUESDAY, program, 45, 0, 0, [], null, {
    strategy: "fixed_step",
    fixedStepMinutes: 15
  });
  assert.ok(slots.length >= 2, "need at least 2 slots to verify interval");
  const diff = (slots[1]!.getTime() - slots[0]!.getTime()) / 60_000;
  assert.equal(diff, 15, "fixed-step strategy should produce 15-minute spacing");
});

test("computeFreeSlots: concurrent booking attempt — second insert sees no free slot", () => {
  const program = makeProgram({ luni: ["10:00", "11:00"] }); // 1-hour day
  // Before first booking
  const before = computeFreeSlots(MONDAY, program, 60, 0, 0, []);
  assert.equal(before.length, 1, "one 60-min slot in a 60-min window");

  // Simulate first booking committed — now occupied
  const occupied: IntervalOccupat[] = [
    {
      start: buc("2026-11-02T10:00:00"),
      end: buc("2026-11-02T11:00:00")
    }
  ];
  const after = computeFreeSlots(MONDAY, program, 60, 0, 0, occupied);
  assert.equal(after.length, 0, "second concurrent request should see zero slots");
});
