import { addHours, addMinutes, subMinutes } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";

export type ReminderType = "24h" | "2h" | "morning";

const TZ = "Europe/Bucharest";

/** Minimum lead time before appointment — never remind for slots already started. */
export const REMINDER_MIN_LEAD_MINUTES = 30;

/**
 * Calendar window for querying programari.data_start (Europe/Bucharest).
 * Caller must also filter data_start > now (+ optional lead buffer).
 */
export function getReminderWindow(type: ReminderType, now: Date = new Date()): { from: Date; to: Date } {
  if (type === "24h") {
    const nextDay = formatInTimeZone(addHours(now, 24), TZ, "yyyy-MM-dd");
    return {
      from: toDate(`${nextDay}T00:00:00`, { timeZone: TZ }),
      to: toDate(`${nextDay}T23:59:59`, { timeZone: TZ })
    };
  }
  if (type === "morning") {
    const today = formatInTimeZone(now, TZ, "yyyy-MM-dd");
    return {
      from: toDate(`${today}T00:00:00`, { timeZone: TZ }),
      to: toDate(`${today}T23:59:59`, { timeZone: TZ })
    };
  }
  // 2h: wide band so */30 cron runs still catch the slot (narrow 5m missed most bookings).
  const target = addHours(now, 2);
  return {
    from: subMinutes(target, 20),
    to: addMinutes(target, 20)
  };
}

export function getEarliestReminderStart(now: Date = new Date()): Date {
  return addMinutes(now, REMINDER_MIN_LEAD_MINUTES);
}
