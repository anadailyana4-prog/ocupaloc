import { NextResponse } from "next/server";

import { getOwnerKpis } from "@/lib/owner/data";
import { logOwnerAction, requireOwnerAdminFromRequest } from "@/lib/owner/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireOwnerAdminFromRequest(request);
    const stats = await getOwnerKpis();

    await logOwnerAction("owner_stats_read", "owner_stats", undefined, undefined, {
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent
    });

    return NextResponse.json({ ok: true, stats });
  } catch {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
}
