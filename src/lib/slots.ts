import { addMinutes, isAfter, isBefore, parseISO, startOfDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

import type { ProgramSaptamanal, ProgramSlotConfig } from "@/lib/program";
import { ziKeyFromDate } from "@/lib/program";

const TZ = "Europe/Bucharest";

export type IntervalOccupat = { start: Date; end: Date };
export type PauzaZilnica = { start: string; durationMinutes: number };

function normalizeStepMinutes(step: number): number {
  if (!Number.isInteger(step) || step < 5 || step > 180) return 15;
  return step;
}

function resolveSlotStepMinutes(
  durationMinutes: number,
  pauseBetweenClientsMinutes: number,
  slotConfig?: ProgramSlotConfig | null
): number {
  if (slotConfig?.strategy === "fixed_step") {
    return normalizeStepMinutes(slotConfig.fixedStepMinutes ?? 15);
  }

  const duration = Number.isFinite(durationMinutes) ? Math.max(0, Math.trunc(durationMinutes)) : 0;
  const pause = Number.isFinite(pauseBetweenClientsMinutes) ? Math.max(0, Math.trunc(pauseBetweenClientsMinutes)) : 0;
  const serviceBlock = duration + pause;
  if (serviceBlock <= 0) return 15;
  return normalizeStepMinutes(serviceBlock);
}

function parseHHMMOnDay(zonedDayStart: Date, hhmm: string, zone: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const z = toZonedTime(zonedDayStart, zone);
  z.setHours(h ?? 0, m ?? 0, 0, 0);
  return fromZonedTime(z, zone);
}

/** data_final la salvare = start + durata + pauză + (pregătire dacă nu există programări mai devreme în aceeași zi de lucru) */
export function calcDataFinalProgramare(
  dataStart: Date,
  durataMinute: number,
  pauzaIntre: number,
  timpPregatire: number,
  ePrimulSlotZi: boolean
): Date {
  const extraPrep = ePrimulSlotZi ? timpPregatire : 0;
  return addMinutes(dataStart, durataMinute + pauzaIntre + extraPrep);
}

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return isBefore(aStart, bEnd) && isBefore(bStart, aEnd);
}

/** dateStr = YYYY-MM-DD (ziua calendaristică în Europe/Bucharest) */
export function computeFreeSlots(
  dateStr: string,
  program: ProgramSaptamanal,
  durataServiciu: number,
  pauzaIntre: number,
  timpPregatire: number,
  ocupate: IntervalOccupat[],
  pauzaZilnica?: PauzaZilnica | null,
  slotConfig?: ProgramSlotConfig | null
): Date[] {
  const ref = toZonedTime(parseISO(`${dateStr}T12:00:00.000Z`), TZ);
  const zonedDayStart = startOfDay(ref);
  const key = ziKeyFromDate(zonedDayStart);
  const interval = program[key];
  if (!interval || interval.length !== 2) return [];

  const workStart = parseHHMMOnDay(zonedDayStart, interval[0], TZ);
  const workEnd = parseHHMMOnDay(zonedDayStart, interval[1], TZ);

  let pauzaInterval: IntervalOccupat | null = null;
  if (pauzaZilnica && pauzaZilnica.durationMinutes > 0) {
    const start = parseHHMMOnDay(zonedDayStart, pauzaZilnica.start, TZ);
    const end = addMinutes(start, pauzaZilnica.durationMinutes);
    if (isBefore(start, workEnd) && isAfter(end, workStart)) {
      pauzaInterval = { start, end };
    }
  }

  const sorted = [...ocupate].sort((a, b) => a.start.getTime() - b.start.getTime());
  const slotStepMinutes = resolveSlotStepMinutes(durataServiciu, pauzaIntre, slotConfig);

  const slots: Date[] = [];
  for (let t = workStart; isBefore(t, workEnd); t = addMinutes(t, slotStepMinutes)) {
    const hasEarlierBooking = sorted.some((o) => isBefore(o.start, t));
    const prep = !hasEarlierBooking ? timpPregatire : 0;
    const endNeeded = addMinutes(t, durataServiciu + pauzaIntre + prep);
    if (isAfter(endNeeded, workEnd)) break;

    const clashProgramari = sorted.some((o) => rangesOverlap(t, endNeeded, o.start, o.end));
    const clashPauza = pauzaInterval ? rangesOverlap(t, endNeeded, pauzaInterval.start, pauzaInterval.end) : false;
    const clash = clashProgramari || clashPauza;
    if (!clash) {
      slots.push(t);
    }
  }
  return slots;
}

export function formatSlotLabel(d: Date): string {
  const z = toZonedTime(d, TZ);
  const hh = String(z.getHours()).padStart(2, "0");
  const mm = String(z.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
