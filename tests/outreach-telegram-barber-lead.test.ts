import assert from "node:assert/strict";
import test from "node:test";

import {
  BARBER_OUTREACH_DEMO_SERVICES,
  buildBarberWhatsAppOutreachMessage
} from "../src/lib/demo/barber-outreach";
import { sanitizeDemoBusinessName } from "../src/lib/demo/create-demo";
import {
  buildWhatsAppLink,
  looksLikeBarberLeadAttempt,
  parseTelegramBarberLead
} from "../src/lib/outreach/telegram-barber-lead";
import { buildDemoUrls } from "../src/lib/demo/create-demo";

test("BARBER_OUTREACH_DEMO_SERVICES start with Tuns", () => {
  assert.equal(BARBER_OUTREACH_DEMO_SERVICES.length, 3);
  assert.match(BARBER_OUTREACH_DEMO_SERVICES[0]!.name, /^Tuns$/);
});

test("parseTelegramBarberLead accepts phone space business name", () => {
  const lead = parseTelegramBarberLead("0722123456 Barber Shop Victor");
  assert.ok(lead);
  assert.equal(lead.phone, "0722123456");
  assert.equal(lead.businessName, "Barber Shop Victor");
});

test("parseTelegramBarberLead accepts messy names and symbols", () => {
  const lead = parseTelegramBarberLead("0722123456 #1 Barber & Co!");
  assert.ok(lead);
  assert.equal(lead.businessName, "#1 Barber & Co!");
});

test("looksLikeBarberLeadAttempt is true for phone plus text", () => {
  assert.equal(looksLikeBarberLeadAttempt("0722123456 X"), true);
  assert.equal(looksLikeBarberLeadAttempt("0722123456"), false);
});

test("sanitizeDemoBusinessName keeps readable salon names", () => {
  assert.equal(sanitizeDemoBusinessName("#1 Barber & Co!"), "1 Barber & Co");
  assert.equal(sanitizeDemoBusinessName("AB"), "AB");
});

test("buildBarberWhatsAppOutreachMessage names salon and explains need", () => {
  const salon = "Barber Shop Victor";
  const { demoUrl, signupUrl } = buildDemoUrls("https://ocupaloc.ro", "abc12345", salon);
  const message = buildBarberWhatsAppOutreachMessage({
    businessName: salon,
    demoUrl,
    signupUrl
  });

  assert.match(message, /Barber Shop Victor/i);
  assert.ok(message.includes(demoUrl));
  assert.doesNotMatch(message, /clientele/i);
});

test("buildWhatsAppLink encodes personalized message", () => {
  const link = buildWhatsAppLink("0722123456", "Salut demo");
  assert.match(link, /^https:\/\/wa\.me\/40722123456\?text=/);
});
