import { NextResponse } from "next/server";
import { handleBookRequest } from "@/lib/booking/book-request-handler";
import { getRequestId, recordOperationalEvent } from "@/lib/ops-events";

/**
 * POST /api/book
 *
 * Creates a new appointment (programare) for a given profesionist slug.
 * No authentication required — public endpoint used by the booking widget.
 *
 * Rate limiting is handled inside {@link handleBookRequest} (10 req/min per IP+slug).
 *
 * @body {BookingPayload} JSON with orgSlug, serviceId, staffId?, startTime,
 *   clientName, clientPhone, clientEmail?
 * @returns 200 with the created programare id, or 4xx/5xx with `{ error }` message.
 */
export async function POST(req: Request) {
  const startedAt = Date.now();
  const requestId = getRequestId(req.headers);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    await recordOperationalEvent({
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

  const result = await handleBookRequest(json, ip, requestId);

  await recordOperationalEvent({
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
