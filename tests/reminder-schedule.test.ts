import { describe, it, expect } from "vitest";
import { formatInTimeZone, toDate } from "date-fns-tz";

import { getEarliestReminderStart, getReminderWindow } from "@/lib/jobs/reminder-schedule";

describe("getReminderWindow", () => {
  it("2h window is wide enough for */30 cron", () => {
    const now = toDate("2026-05-22T12:00:00", { timeZone: "Europe/Bucharest" });
    const { from, to } = getReminderWindow("2h", now);
    const spanMinutes = (to.getTime() - from.getTime()) / 60_000;
    expect(spanMinutes).toBeGreaterThanOrEqual(35);
  });

  it("24h window targets next calendar day in Bucharest", () => {
    const now = toDate("2026-05-22T14:00:00", { timeZone: "Europe/Bucharest" });
    const { from, to } = getReminderWindow("24h", now);
    expect(formatInTimeZone(from, "Europe/Bucharest", "yyyy-MM-dd")).toBe("2026-05-23");
    expect(formatInTimeZone(to, "Europe/Bucharest", "yyyy-MM-dd")).toBe("2026-05-23");
  });
});

describe("getEarliestReminderStart", () => {
  it("is at least 30 minutes after now", () => {
    const now = new Date("2026-05-22T10:00:00Z");
    const earliest = getEarliestReminderStart(now);
    expect(earliest.getTime() - now.getTime()).toBe(30 * 60_000);
  });
});
