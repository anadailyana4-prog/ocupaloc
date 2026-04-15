import { addMinutes, isAfter, isBefore, parseISO, startOfDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

import type { ProgramSaptamanal } from "@/lib/program";
import { ziKeyFromDate } from "@/lib/program";

const TZ = "Europe/Bucharest";

export type IntervalOccupat = { start: Date; end: Date };

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
  ocupate: IntervalOccupat[]
): Date[] {
  const ref = toZonedTime(parseISO(`${dateStr}T12:00:00.000Z`), TZ);
  const zonedDayStart = startOfDay(ref);
  const key = ziKeyFromDate(zonedDayStart);
  const interval = program[key];
  if (!interval || interval.length !== 2) return [];

  const workStart = parseHHMMOnDay(zonedDayStart, interval[0], TZ);
  const workEnd = parseHHMMOnDay(zonedDayStart, interval[1], TZ);

  const sorted = [...ocupate].sort((a, b) => a.start.getTime() - b.start.getTime());

  const slots: Date[] = [];
  for (let t = workStart; isBefore(t, workEnd); t = addMinutes(t, 15)) {
    const hasEarlierBooking = sorted.some((o) => isBefore(o.start, t));
    const prep = !hasEarlierBooking ? timpPregatire : 0;
    const endNeeded = addMinutes(t, durataServiciu + pauzaIntre + prep);
    if (isAfter(endNeeded, workEnd)) break;

    const clash = sorted.some((o) => rangesOverlap(t, endNeeded, o.start, o.end));
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
