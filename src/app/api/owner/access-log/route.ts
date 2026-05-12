import { NextResponse } from "next/server";

import { logOwnerAction, requireOwnerAdminFromRequest } from "@/lib/owner/auth";

type Body = {
  action?: unknown;
};

export async function POST(request: Request) {
  try {
    const auth = await requireOwnerAdminFromRequest(request);
    const body = (await request.json().catch(() => ({}))) as Body;
    const action = String(body.action ?? "access").slice(0, 80);

    await logOwnerAction(`owner_${action}`, "owner_access", auth.admin.id, undefined, {
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
}
