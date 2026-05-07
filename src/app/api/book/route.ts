import { handleBookRouteRequest } from "@/app/api/book/handler";

/**
 * POST /api/book
 *
 * Creates a new appointment (programare) for a given profesionist slug.
 * No authentication required — public endpoint used by the booking widget.
 *
 * Supports optional Idempotency-Key header for safe request replay.
 * Rate limiting is handled inside {@link handleBookRequest} (10 req/min per IP+slug).
 *
 * @body {BookingPayload} JSON with orgSlug, serviceId, staffId?, startTime,
 *   clientName, clientPhone, clientEmail?
 * @header Idempotency-Key optional key for request deduplication (24h expiry)
 * @returns 200 with the created programare id, or 4xx/5xx with `{ error }` message.
 */
export async function POST(req: Request) {
  return handleBookRouteRequest(req);
}
