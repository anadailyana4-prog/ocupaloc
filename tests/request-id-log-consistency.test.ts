import assert from "node:assert/strict";
import test from "node:test";

import { handleBookRouteRequest } from "../src/app/api/book/handler";

test("booking route propagates requestId to handler, ops events, and response header", async () => {
  const seenRequestIds: string[] = [];

  const deps = {
    getRequestId: (headers: Headers) => headers.get("x-request-id") ?? "generated-id",
    findIdempotencyResult: async () => null,
    saveIdempotencyResult: async () => undefined,
    handleBookRequest: async (_payload: unknown, _ip: string, requestId?: string) => {
      seenRequestIds.push(requestId ?? "");
      return {
        status: 200,
        body: { success: true, error: null }
      };
    },
    recordOperationalEvent: async (event: { requestId?: string }) => {
      seenRequestIds.push(event.requestId ?? "");
    }
  };

  const req = new Request("https://ocupaloc.ro/api/book", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": "rid-123"
    },
    body: JSON.stringify({
      orgSlug: "demo-salon",
      serviceId: "11111111-1111-4111-8111-111111111111",
      startTime: "2026-05-01T10:00:00.000Z",
      clientName: "Ana Client",
      clientPhone: "0712345678",
      clientEmail: "ana@example.com"
    })
  });

  const res = await handleBookRouteRequest(req, deps as never);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-request-id"), "rid-123");
  assert.deepEqual(seenRequestIds, ["rid-123", "rid-123"]);
});