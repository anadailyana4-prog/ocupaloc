import assert from "node:assert/strict";
import test from "node:test";

import {
  BARBER_OUTREACH_DEMO_SERVICES,
  buildBarberWhatsAppOutreachMessage
} from "../src/lib/demo/barber-outreach";
import {
  buildWhatsAppLink,
  parseTelegramBarberLead
} from "../src/lib/outreach/telegram-barber-lead";
import { buildDemoUrls } from "../src/lib/demo/create-demo";

test("BARBER_OUTREACH_DEMO_SERVICES start with Tuns", () => {
  assert.equal(BARBER_OUTREACH_DEMO_SERVICES.length, 3);
  assert.match(BARBER_OUTREACH_DEMO_SERVICES[0]!.name, /^Tuns$/);
  assert.match(BARBER_OUTREACH_DEMO_SERVICES[0]!.label, /^Tuns ·/);
});

test("parseTelegramBarberLead accepts phone and business name", () => {
  const lead = parseTelegramBarberLead("0722 123 456 | Frizerie Maria");
  assert.ok(lead);
  assert.equal(lead.businessName, "Frizerie Maria");
});

test("buildBarberWhatsAppOutreachMessage names salon and explains need", () => {
  const salon = "Barber Shop Victor";
  const { demoUrl, signupUrl } = buildDemoUrls("https://ocupaloc.ro", "abc12345", salon);
  const message = buildBarberWhatsAppOutreachMessage({
    businessName: salon,
    demoUrl,
    signupUrl
  });

  assert.match(message, new RegExp(salon.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  assert.match(message, /Tuns/i);
  assert.match(message, /nu răspunzi la telefon/i);
  assert.match(message, /merge la alt salon/i);
  assert.match(message, /fără comision/i);
  assert.match(message, /2 minute/i);
  assert.ok(message.includes(demoUrl));
  assert.ok(message.includes(signupUrl));
  assert.doesNotMatch(message, /clientele/i);
});

test("buildWhatsAppLink encodes personalized message", () => {
  const link = buildWhatsAppLink("0722123456", "Salut demo");
  assert.match(link, /^https:\/\/wa\.me\/40722123456\?text=/);
});
