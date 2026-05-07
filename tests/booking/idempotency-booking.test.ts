import assert from "node:assert/strict";
import test from "node:test";

import { handleBookRouteRequest } from "../../src/app/api/book/handler";

const validPayload = {
  orgSlug: "demo-salon",
  serviceId: "f8b1af13-a5d6-46c1-9a42-68370958b36c",
  startTime: "2026-05-08T06:40:00.000Z",
  clientName: "Ana Client",
  clientPhone: "0712345678",
  clientEmail: "ana@example.com"
};

test("same request and same idempotency key returns cached result and inserts once", async () => {
  let insertCount = 0;
  const cache = new Map<string, Record<string, unknown>>();

  const deps = {
    getRequestId: () => "req-id-1",
    findIdempotencyResult: async (key: string) => cache.get(key) ?? null,
    saveIdempotencyResult: async (key: string, result: Record<string, unknown>) => {
      cache.set(key, result);
    },
    handleBookRequest: async () => {
      insertCount += 1;
      return {
        status: 200,
        body: {
          success: true,
          error: null
        }
      };
    },
    recordOperationalEvent: async () => undefined
  };

  const req1 = new Request("https://ocupaloc.ro/api/book", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": "same-key-123"
    },
    body: JSON.stringify(validPayload)
  });

  const req2 = new Request("https://ocupaloc.ro/api/book", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": "same-key-123"
    },
    body: JSON.stringify(validPayload)
  });

  const res1 = await handleBookRouteRequest(req1, deps);
  const body1 = await res1.json();

  const res2 = await handleBookRouteRequest(req2, deps);
  const body2 = await res2.json();

  assert.equal(res1.status, 200);
  assert.equal(res2.status, 200);
  assert.deepEqual(body2, body1);
  assert.equal(insertCount, 1);
});