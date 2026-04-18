import { NextRequest, NextResponse } from "next/server";

import { logBookingStatusEvent } from "@/lib/booking/status-events";
import { verifyBookingConfirmationLink } from "@/lib/booking/confirmation-link";
import { notifyProfesionistClientResponse } from "@/lib/email/programare-notify";
import { reportError } from "@/lib/observability";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams;
  const booking = search.get("booking") ?? "";
  const action = search.get("action") ?? "";
  const exp = search.get("exp") ?? "";
  const sig = search.get("sig") ?? "";

  if (!booking || !action || !exp || !sig) {
    return NextResponse.redirect(new URL("/programare/confirmare?state=invalid", req.url));
  }

  const verified = verifyBookingConfirmationLink({
    bookingId: booking,
    action,
    exp,
    sig
  });

  if (!verified.ok) {
    const url = new URL("/programare/confirmare", req.url);
    url.searchParams.set("state", "invalid");
    return NextResponse.redirect(url);
  }

  const admin = createSupabaseServiceClient();

  const { data: current } = await admin.from("programari").select("id, status, profesionisti(slug)").eq("id", booking).maybeSingle();
  if (!current?.id) {
    const url = new URL("/programare/confirmare", req.url);
    url.searchParams.set("state", "not_found");
    return NextResponse.redirect(url);
  }

  const targetStatus = verified.action === "cancel" ? "anulat" : "confirmat";
  const { error } = await admin.from("programari").update({ status: targetStatus }).eq("id", booking);

  if (!error) {
    await logBookingStatusEvent({
      bookingId: booking,
      status: targetStatus,
      source: "client_link"
    });
    try {
      await notifyProfesionistClientResponse(booking, targetStatus);
    } catch (notifyError) {
      reportError("email", "notify_profesionist_client_response_failed", notifyError, {
        bookingId: booking,
        status: targetStatus
      });
    }
  }

  const rel = current.profesionisti as { slug?: string } | { slug?: string }[] | null;
  const prof = Array.isArray(rel) ? rel[0] ?? null : rel;

  const url = new URL("/programare/confirmare", req.url);
  url.searchParams.set("state", error ? "error" : verified.action === "cancel" ? "cancelled" : "confirmed");
  if (prof?.slug) {
    url.searchParams.set("slug", prof.slug);
  }
  return NextResponse.redirect(url);
}
