import { NextResponse } from "next/server";

import { requireOwnerAdminFromRequest } from "@/lib/owner/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    await requireOwnerAdminFromRequest(request);

    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);
    const admin = createSupabaseServiceClient();

    const { data, error } = await admin
      .from("outreach_replies")
      .select("id, lead_id, from_email, subject, text_body, received_at, is_auto_reply")
      .order("received_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, replies: data });
  } catch {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
}