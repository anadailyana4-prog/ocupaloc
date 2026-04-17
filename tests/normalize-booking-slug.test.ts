import assert from "node:assert/strict";
import test from "node:test";

import { normalizeBookingSlug } from "../src/lib/booking/normalize-booking-slug";

test("normalizeBookingSlug trims and lowercases", () => {
  assert.equal(normalizeBookingSlug("  Salon-Unu  "), "salon-unu");
});

test("normalizeBookingSlug keeps internal separators", () => {
  assert.equal(normalizeBookingSlug(" My_Salon "), "my_salon");
});
