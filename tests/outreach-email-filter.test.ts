import test from "node:test";
import assert from "node:assert/strict";

import { extractFirstValidEmail, normalizeEmailCandidate } from "@/lib/outreach/email-filter";

test("normalizeEmailCandidate accepts real business emails", () => {
  assert.equal(normalizeEmailCandidate(" Office@JustMenBarbershop.ro "), "office@justmenbarbershop.ro");
});

test("normalizeEmailCandidate rejects junk and tracking addresses", () => {
  assert.equal(normalizeEmailCandidate("logo-retrobarbershop@2x.png"), null);
  assert.equal(normalizeEmailCandidate("388fe63e6063cc241ca2a1b0f52622a3@o61919.ingest.us.sentry.io"), null);
  assert.equal(normalizeEmailCandidate("asistenta@mero.ro"), null);
  assert.equal(normalizeEmailCandidate("#"), null);
});

test("extractFirstValidEmail prefers usable mailto or inline emails", () => {
  const html = '<a href="mailto:contact@cornerbarbershop.ro">Scrie-ne</a> <img src="logo-retrobarbershop@2x.png" />';
  assert.equal(extractFirstValidEmail(html), "contact@cornerbarbershop.ro");
});