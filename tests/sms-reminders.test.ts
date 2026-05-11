import assert from "node:assert/strict";
import test, { mock } from "node:test";

import { buildReminderSmsText, sendReminderSms } from "../src/lib/sms/reminders";

test.afterEach(() => {
  mock.restoreAll();
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_FROM_NUMBER;
  delete process.env.TWILIO_MESSAGING_SERVICE_SID;
  delete process.env.MESSAGEBIRD_API_KEY;
  delete process.env.MESSAGEBIRD_ORIGINATOR;
});

test("buildReminderSmsText: includes salon, service and local date/time", () => {
  const text = buildReminderSmsText({
    salonName: "Salon X",
    serviceName: "Tuns",
    startsAt: new Date("2026-12-01T08:00:00.000Z"),
    type: "24h"
  });

  assert.match(text, /Salon X/);
  assert.match(text, /Tuns/);
  assert.match(text, /01\.12\.2026/);
});

test("sendReminderSms: sends Twilio request when credentials are present", async () => {
  process.env.TWILIO_ACCOUNT_SID = "AC123";
  process.env.TWILIO_AUTH_TOKEN = "auth-token";
  process.env.TWILIO_FROM_NUMBER = "+40111222333";

  let called = 0;
  mock.method(globalThis, "fetch", async (_url: string, init?: RequestInit) => {
    called += 1;
    assert.equal(init?.method, "POST");
    assert.match(String(init?.body ?? ""), /To=%2B40712345678/);
    return new Response("ok", { status: 201 });
  });

  const ok = await sendReminderSms(
    {
      clientPhone: "0712 345 678",
      salonName: "Salon X",
      serviceName: "Tuns",
      startsAt: new Date("2026-12-01T08:00:00.000Z"),
      provider: "twilio"
    },
    "2h"
  );

  assert.equal(ok, true);
  assert.equal(called, 1);
});

test("sendReminderSms: returns false for MessageBird when originator is missing", async () => {
  process.env.MESSAGEBIRD_API_KEY = "mb-key";

  const ok = await sendReminderSms(
    {
      clientPhone: "0712345678",
      salonName: "Salon X",
      serviceName: "Tuns",
      startsAt: new Date("2026-12-01T08:00:00.000Z"),
      provider: "messagebird"
    },
    "morning"
  );

  assert.equal(ok, false);
});
