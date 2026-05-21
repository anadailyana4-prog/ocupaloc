/**
 * Tests for POST /api/book orchestration: idempotency cache, JSON parse,
 * operational events, and delegation to handleBookRequest.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { handleBookRouteRequest, type BookRouteDeps } from "../src/app/api/book/handler";

const validBody = {
  orgSlug: "salon-test",
  serviceId: "11111111-1111-4111-8111-111111111111",
  startTime: "2026-05-01T10:00:00.000Z",
  clientName: "Ana",
  clientPhone: "0712345678",
  clientEmail: "a@b.co"
};

function postRequest(body: unknown, headerMap: Record<string, string> = {}) {
  return new Request("https://ocupaloc.ro/api/book", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.9",
      ...headerMap
    },
    body: typeof body === "string" ? body : JSON.stringify(body)
  });
}

test("idempotency cache HIT returns cached JSON without calling handleBookRequest", async () => {
  let bookCalled = false;
  let saveCalled = false;
  const cached = { success: true, error: null, fromCache: true };
  const deps: BookRouteDeps = {
    getRequestId: () => "rid-cache",
    findIdempotencyResult: async (key) => (key === "idem-abc" ? cached : null),
    saveIdempotencyResult: async () => {
      saveCalled = true;
    },
    handleBookRequest: async () => {
      bookCalled = true;
      return { status: 200, body: { success: true, error: null } };
    },
    recordOperationalEvent: async () => {}
  };

  const req = postRequest(validBody, { "idempotency-key": "idem-abc" });
  const res = await handleBookRouteRequest(req, deps);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), cached);
  assert.equal(bookCalled, false);
  assert.equal(saveCalled, false);
  assert.equal(res.headers.get("x-request-id"), "rid-cache");
});

test("idempotency cache MISS on 200 saves result and records booking_created", async () => {
  const events: Array<{ eventType: string; outcome: string }> = [];
  let savedKey = "";
  let savedBody: Record<string, unknown> | null = null;

  const deps: BookRouteDeps = {
    getRequestId: () => "rid-miss",
    findIdempotencyResult: async () => null,
    saveIdempotencyResult: async (key, body) => {
      savedKey = key;
      savedBody = body;
    },
    handleBookRequest: async () => ({
      status: 200,
      body: { success: true, error: null }
    }),
    recordOperationalEvent: async (e) => {
      events.push({ eventType: e.eventType, outcome: e.outcome });
    }
  };

  const req = postRequest(validBody, { "idempotency-key": "idem-new" });
  const res = await handleBookRouteRequest(req, deps);
  assert.equal(res.status, 200);
  assert.equal(savedKey, "idem-new");
  assert.deepEqual(savedBody, { success: true, error: null });
  const booked = events.find((x) => x.eventType === "booking_created");
  assert.ok(booked);
  assert.equal(booked?.outcome, "success");
});

test("invalid JSON returns 400 and records booking_failed", async () => {
  const events: Array<{ eventType: string; outcome: string; statusCode: number }> = [];
  let bookCalled = false;
  const deps: BookRouteDeps = {
    getRequestId: () => "rid-bad-json",
    findIdempotencyResult: async () => null,
    saveIdempotencyResult: async () => {},
    handleBookRequest: async () => {
      bookCalled = true;
      return { status: 200, body: { success: true, error: null } };
    },
    recordOperationalEvent: async (e) => {
      events.push({
        eventType: e.eventType,
        outcome: e.outcome,
        statusCode: e.statusCode ?? 0
      });
    }
  };

  const req = postRequest("not-json{", {});
  const res = await handleBookRouteRequest(req, deps);
  assert.equal(res.status, 400);
  assert.match((await res.json()).error as string, /invalid/i);
  assert.equal(bookCalled, false);
  assert.ok(events.some((e) => e.eventType === "booking_failed" && e.outcome === "failure"));
  assert.equal(events[0]?.statusCode, 400);
});

test("booking failure still records operational event", async () => {
  const events: Array<{ eventType: string; statusCode: number }> = [];
  const deps: BookRouteDeps = {
    getRequestId: () => "rid-fail",
    findIdempotencyResult: async () => null,
    saveIdempotencyResult: async () => {},
    handleBookRequest: async () => ({
      status: 409,
      body: { success: false, error: "conflict" }
    }),
    recordOperationalEvent: async (e) => {
      events.push({ eventType: e.eventType, statusCode: e.statusCode ?? 0 });
    }
  };

  const res = await handleBookRouteRequest(postRequest(validBody), deps);
  assert.equal(res.status, 409);
  assert.ok(events.some((e) => e.eventType === "booking_failed" && e.statusCode === 409));
});

test("successful booking without idempotency key does not call saveIdempotencyResult", async () => {
  let saveCalled = false;
  const deps: BookRouteDeps = {
    getRequestId: () => "rid-noidem",
    findIdempotencyResult: async () => null,
    saveIdempotencyResult: async () => {
      saveCalled = true;
    },
    handleBookRequest: async () => ({
      status: 200,
      body: { success: true, error: null }
    }),
    recordOperationalEvent: async () => {}
  };

  await handleBookRouteRequest(postRequest(validBody), deps);
  assert.equal(saveCalled, false);
});
