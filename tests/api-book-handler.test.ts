import assert from "node:assert/strict";
import test from "node:test";

import { handleBookRequest, type BookRouteDeps } from "../src/lib/booking/book-request-handler";

const validPayload = {
  orgSlug: "  SALON-TEST  ",
  serviceId: "11111111-1111-4111-8111-111111111111",
  startTime: "2026-05-01T10:00:00.000Z",
  clientName: "Ana Client",
  clientPhone: "0712 345 678",
  clientEmail: "ana@example.com"
};

function makeDeps(overrides?: Partial<BookRouteDeps>): BookRouteDeps {
  return {
    createAdmin: () => ({}) as ReturnType<BookRouteDeps["createAdmin"]>,
    checkRateLimit: async () => ({ allowed: true }),
    insertBooking: async () => ({ ok: true, programareId: "p-1" }),
    notifyProfesionist: async () => true,
    notifyClient: async () => true,
    ...overrides
  };
}

test("handleBookRequest returns 400 for invalid payload", async () => {
  const result = await handleBookRequest({}, "127.0.0.1", makeDeps());
  assert.equal(result.status, 400);
  assert.equal(result.body.success, false);
});

test("handleBookRequest applies normalized slug to rate-limit key", async () => {
  let capturedKey = "";
  const deps = makeDeps({
    checkRateLimit: async (_admin, key) => {
      capturedKey = key;
      return { allowed: false };
    }
  });

  const result = await handleBookRequest(validPayload, "127.0.0.1", deps);
  assert.equal(result.status, 429);
  assert.equal(capturedKey, "api:book:salon-test:127.0.0.1");
});

test("handleBookRequest returns success when insert and notifications succeed", async () => {
  let insertSlug = "";
  const deps = makeDeps({
    insertBooking: async (_admin, input) => {
      insertSlug = input.slug;
      return { ok: true, programareId: "programare-123" };
    }
  });

  const result = await handleBookRequest(validPayload, "127.0.0.1", deps);
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(insertSlug, "salon-test");
});

test("handleBookRequest still returns 200 when notifyProfesionist rejects", async () => {
  const deps = makeDeps({
    notifyProfesionist: async () => { throw new Error("SMTP timeout"); }
  });

  const result = await handleBookRequest(validPayload, "127.0.0.1", deps);
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
});

test("handleBookRequest still returns 200 when notifyClient rejects", async () => {
  const deps = makeDeps({
    notifyClient: async () => {
      throw new Error("SMTP timeout");
    }
  });

  const result = await handleBookRequest(validPayload, "127.0.0.1", deps);
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
});

test("handleBookRequest returns 403 when insertBooking returns block message", async () => {
  const deps = makeDeps({
    insertBooking: async () => ({ ok: false, message: "Ne pare rău, sună la salon pentru programare." })
  });

  const result = await handleBookRequest(validPayload, "127.0.0.1", deps);
  assert.equal(result.status, 403);
  assert.equal(result.body.success, false);
});

test("handleBookRequest returns 409 when slot is unavailable", async () => {
  const deps = makeDeps({
    insertBooking: async () => ({ ok: false, message: "Slotul nu mai e disponibil. Alege altă oră." })
  });

  const result = await handleBookRequest(validPayload, "127.0.0.1", deps);
  assert.equal(result.status, 409);
  assert.equal(result.body.success, false);
});

test("handleBookRequest succeeds when clientEmail is absent", async () => {
  const payloadWithoutEmail = Object.fromEntries(
    Object.entries(validPayload).filter(([k]) => k !== "clientEmail")
  ) as typeof validPayload;
  let capturedEmailClient: string | null | undefined = "SENTINEL";
  const deps = makeDeps({
    insertBooking: async (_admin, input) => {
      capturedEmailClient = input.emailClient;
      return { ok: true, programareId: "p-no-email" };
    }
  });

  const result = await handleBookRequest(payloadWithoutEmail, "127.0.0.1", deps);
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(capturedEmailClient, null);
});

test("handleBookRequest succeeds when clientEmail is empty string and treats it as null", async () => {
  let capturedEmailClient: string | null | undefined = "SENTINEL";
  const deps = makeDeps({
    insertBooking: async (_admin, input) => {
      capturedEmailClient = input.emailClient;
      return { ok: true, programareId: "p-empty-email" };
    }
  });

  const result = await handleBookRequest({ ...validPayload, clientEmail: "" }, "127.0.0.1", deps);
  assert.equal(result.status, 400);
  // empty string fails the email() refinement — treated as invalid, not silently dropped
  assert.equal(result.body.success, false);
  assert.equal(capturedEmailClient, "SENTINEL"); // insertBooking not reached
});
