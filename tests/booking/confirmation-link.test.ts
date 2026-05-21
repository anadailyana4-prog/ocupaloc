import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  createBookingConfirmationLink,
  verifyBookingConfirmationLink
} from "../../src/lib/booking/confirmation-link";

const SECRET = "test-hmac-secret-for-booking-links";

afterEach(() => {
  delete process.env.BOOKING_CONFIRMATION_SECRET;
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

test("createBookingConfirmationLink builds signed URL", () => {
  process.env.BOOKING_CONFIRMATION_SECRET = SECRET;
  const url = createBookingConfirmationLink({
    bookingId: "book-1",
    action: "confirm",
    baseUrl: "https://example.com/",
    expiresInSeconds: 3600
  });
  assert.match(url, /^https:\/\/example\.com\/api\/programare\/confirmare\?/);
  assert.match(url, /booking=book-1/);
  assert.match(url, /action=confirm/);
  assert.match(url, /sig=/);
});

test("getSecret throws when BOOKING_CONFIRMATION_SECRET missing", () => {
  assert.throws(
    () => createBookingConfirmationLink({ bookingId: "x", action: "cancel" }),
    /BOOKING_CONFIRMATION_SECRET/
  );
});

test("verifyBookingConfirmationLink accepts valid signature", () => {
  process.env.BOOKING_CONFIRMATION_SECRET = SECRET;
  const url = createBookingConfirmationLink({
    bookingId: "b-2",
    action: "reschedule",
    baseUrl: "https://ocupaloc.ro",
    expiresInSeconds: 86_400
  });
  const u = new URL(url);
  const out = verifyBookingConfirmationLink({
    bookingId: u.searchParams.get("booking")!,
    action: u.searchParams.get("action")!,
    exp: u.searchParams.get("exp")!,
    sig: u.searchParams.get("sig")!
  });
  assert.equal(out.ok, true);
  if (out.ok) assert.equal(out.action, "reschedule");
});

test("verifyBookingConfirmationLink rejects bad action", () => {
  process.env.BOOKING_CONFIRMATION_SECRET = SECRET;
  const v = verifyBookingConfirmationLink({
    bookingId: "x",
    action: "hack",
    exp: String(Math.floor(Date.now() / 1000) + 3600),
    sig: "00"
  });
  assert.equal(v.ok, false);
});

test("verifyBookingConfirmationLink rejects expired token", () => {
  process.env.BOOKING_CONFIRMATION_SECRET = SECRET;
  const expPast = String(Math.floor(Date.now() / 1000) - 60);
  const sig = "deadbeef";
  const out = verifyBookingConfirmationLink({
    bookingId: "old",
    action: "confirm",
    exp: expPast,
    sig
  });
  assert.equal(out.ok, false);
  if (!out.ok) assert.match(out.message, /expirat/i);
});

test("verifyBookingConfirmationLink rejects non-numeric exp", () => {
  process.env.BOOKING_CONFIRMATION_SECRET = SECRET;
  const out = verifyBookingConfirmationLink({
    bookingId: "x",
    action: "confirm",
    exp: "not-a-number",
    sig: "ab"
  });
  assert.equal(out.ok, false);
  if (!out.ok) assert.match(out.message, /invalid/i);
});

test("verifyBookingConfirmationLink rejects wrong signature", () => {
  process.env.BOOKING_CONFIRMATION_SECRET = SECRET;
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const out = verifyBookingConfirmationLink({
    bookingId: "b1",
    action: "confirm",
    exp: String(exp),
    sig: "0".repeat(64)
  });
  assert.equal(out.ok, false);
  if (!out.ok) assert.match(out.message, /Semnătură invalidă/i);
});
