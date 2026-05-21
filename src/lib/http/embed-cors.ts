import { NextResponse } from "next/server";

/** CORS for embeddable booking widget (third-party sites load script from OcupaLoc). */
export const EMBED_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Idempotency-Key, x-request-id, x-correlation-id"
};

export function withEmbedCors(res: NextResponse): NextResponse {
  const headers = new Headers(res.headers);
  for (const [key, value] of Object.entries(EMBED_CORS_HEADERS)) {
    headers.set(key, value);
  }
  return new NextResponse(res.body, { status: res.status, headers });
}

export function embedCorsOptions(): NextResponse {
  return new NextResponse(null, { status: 204, headers: EMBED_CORS_HEADERS });
}
