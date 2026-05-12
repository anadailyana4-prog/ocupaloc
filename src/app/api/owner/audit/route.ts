import { NextResponse } from "next/server";

import { logOwnerAction, requireOwnerAdminFromRequest } from "@/lib/owner/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const auth = await requireOwnerAdminFromRequest(request);
    const url = new URL(request.url);
    const limit = Math.min(500, Math.max(10, Number.parseInt(url.searchParams.get("limit") ?? "100", 10) || 100));

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("owner_audit_logs")
      .select("id, user_id, action, resource_type, resource_id, metadata, ip_address, user_agent, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ ok: false, error: "Failed to load audit logs" }, { status: 500 });
    }

    await logOwnerAction("owner_audit_read", "owner_audit_logs", undefined, { limit }, {
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent
    });

    return NextResponse.json({ ok: true, items: data ?? [] });
  } catch {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
}
