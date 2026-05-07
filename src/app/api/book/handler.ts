import { NextResponse } from "next/server";

import { handleBookRequest } from "@/lib/booking/book-request-handler";
import { getRequestId, recordOperationalEvent } from "@/lib/ops-events";
import { findIdempotencyResult, saveIdempotencyResult } from "@/lib/repositories/idempotency-repository";

export type BookRouteDeps = {
  getRequestId: typeof getRequestId;
  findIdempotencyResult: typeof findIdempotencyResult;
  saveIdempotencyResult: typeof saveIdempotencyResult;
  handleBookRequest: typeof handleBookRequest;
  recordOperationalEvent: typeof recordOperationalEvent;
};

const defaultDeps: BookRouteDeps = {
  getRequestId,
  findIdempotencyResult,
  saveIdempotencyResult,
  handleBookRequest,
  recordOperationalEvent
};

export async function handleBookRouteRequest(req: Request, deps: BookRouteDeps = defaultDeps) {
  const startedAt = Date.now();
  const requestId = deps.getRequestId(req.headers);
  const idempotencyKey = req.headers.get("idempotency-key")?.trim();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (idempotencyKey) {
    const cachedResult = await deps.findIdempotencyResult(idempotencyKey);
    if (cachedResult) {
      return NextResponse.json(
        cachedResult,
        { status: 200, headers: { "x-request-id": requestId } }
      );
    }
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    await deps.recordOperationalEvent({
      eventType: "booking_failed",
      flow: "booking",
      outcome: "failure",
      requestId,
      statusCode: 400,
      latencyMs: Date.now() - startedAt,
      metadata: { reason: "invalid_json" }
    });
    return NextResponse.json({ success: false, error: "Body JSON invalid." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const result = await deps.handleBookRequest(json, ip, requestId, idempotencyKey);

  if (idempotencyKey && result.status === 200) {
    await deps.saveIdempotencyResult(idempotencyKey, result.body as Record<string, unknown>);
  }

  await deps.recordOperationalEvent({
    eventType: result.status >= 200 && result.status < 300 ? "booking_created" : "booking_failed",
    flow: "booking",
    outcome: result.status >= 200 && result.status < 300 ? "success" : "failure",
    requestId,
    statusCode: result.status,
    latencyMs: Date.now() - startedAt,
    metadata: { endpoint: "/api/book" }
  });

  return NextResponse.json(result.body, { status: result.status, headers: { "x-request-id": requestId } });
}