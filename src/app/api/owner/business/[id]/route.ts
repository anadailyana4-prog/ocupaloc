import { NextResponse } from "next/server";

import { getOwnerBusinessDetail } from "@/lib/owner/data";
import { logOwnerAction, requireOwnerAdminFromRequest } from "@/lib/owner/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireOwnerAdminFromRequest(request);
    const { id } = await params;

    const detail = await getOwnerBusinessDetail(id);
    if (!detail) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    await logOwnerAction("owner_business_read", "business", id, undefined, {
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent
    });

    return NextResponse.json({ ok: true, detail });
  } catch {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
}
