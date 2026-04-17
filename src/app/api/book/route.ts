import { NextResponse } from "next/server";
import { handleBookRequest } from "@/lib/booking/book-request-handler";

/**
 * Rezervare JSON (ex. BookingCard tenant): slug = profesionist.
 */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Body JSON invalid." }, { status: 400 });
  }

  const result = await handleBookRequest(json, ip);
  return NextResponse.json(result.body, { status: result.status });
}
