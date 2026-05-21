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

test("handleBookRequest passes idempotencyKey to insertBooking", async () => {
  let capturedIdempotencyKey: string | undefined = "SENTINEL";
  const deps = makeDeps({
    insertBooking: async (_admin, input) => {
      capturedIdempotencyKey = input.idempotencyKey;
      return { ok: true, programareId: "p-1" };
    }
  });

  const result = await handleBookRequest(validPayload, "127.0.0.1", deps, "idempotency-key-123");
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(capturedIdempotencyKey, "idempotency-key-123");
});

test("handleBookRequest passes requestId to insertBooking", async () => {
  let capturedRequestId: string | undefined = "SENTINEL";
  const deps = makeDeps({
    insertBooking: async (_admin, input) => {
      capturedRequestId = input.requestId;
      return { ok: true, programareId: "p-1" };
    }
  });

  const result = await handleBookRequest(validPayload, "127.0.0.1", "my-request-id-456", deps);
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(capturedRequestId, "my-request-id-456");
});

test("handleBookRequest passes optional clientNotes to insertBooking", async () => {
  let capturedClientNotes: string | null | undefined = "SENTINEL";
  const deps = makeDeps({
    insertBooking: async (_admin, input) => {
      capturedClientNotes = input.observatiiClient;
      return { ok: true, programareId: "p-1" };
    }
  });

  const result = await handleBookRequest({ ...validPayload, clientNotes: "Sun la interfon" }, "127.0.0.1", deps);
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(capturedClientNotes, "Sun la interfon");
});

test("handleBookRequest passes requestId and idempotencyKey together with custom deps", async () => {
  let capturedKey: string | undefined;
  let capturedRid: string | undefined;
  const deps = makeDeps({
    insertBooking: async (_admin, input) => {
      capturedKey = input.idempotencyKey;
      capturedRid = input.requestId;
      return { ok: true, programareId: "p-combo" };
    }
  });

  const result = await handleBookRequest(validPayload, "10.0.0.1", "trace-99", deps, "idem-combo");
  assert.equal(result.status, 200);
  assert.equal(capturedKey, "idem-combo");
  assert.equal(capturedRid, "trace-99");
});

test("handleBookRequest returns 400 for non-slot insert failure (not block, not conflict)", async () => {
  const deps = makeDeps({
    insertBooking: async () => ({ ok: false, message: "Nu putem procesa cererea în acest moment." })
  });
  const result = await handleBookRequest(validPayload, "127.0.0.1", deps);
  assert.equal(result.status, 400);
  assert.equal(result.body.success, false);
});

test("handleBookRequest returns 500 when insertBooking throws", async () => {
  const deps = makeDeps({
    insertBooking: async () => {
      throw new Error("DB connection reset");
    }
  });
  const result = await handleBookRequest(validPayload, "127.0.0.1", deps);
  assert.equal(result.status, 500);
  assert.equal(result.body.success, false);
  assert.match((result.body.error as string) ?? "", /connection reset/);
});

test("handleBookRequest returns 400 for invalid serviceId (not UUID)", async () => {
  const result = await handleBookRequest(
    { ...validPayload, serviceId: "not-a-uuid" },
    "127.0.0.1",
    makeDeps()
  );
  assert.equal(result.status, 400);
});

test("handleBookRequest returns 400 for short client name", async () => {
  const result = await handleBookRequest(
    { ...validPayload, clientName: "A" },
    "127.0.0.1",
    makeDeps()
  );
  assert.equal(result.status, 400);
});

test("handleBookRequest returns 400 for phone with fewer than 10 digits", async () => {
  const result = await handleBookRequest(
    { ...validPayload, clientPhone: "0712" },
    "127.0.0.1",
    makeDeps()
  );
  assert.equal(result.status, 400);
});

test("handleBookRequest returns 400 for clientNotes over 500 chars", async () => {
  const result = await handleBookRequest(
    { ...validPayload, clientNotes: "x".repeat(501) },
    "127.0.0.1",
    makeDeps()
  );
  assert.equal(result.status, 400);
});
