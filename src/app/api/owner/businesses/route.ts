import { NextResponse } from "next/server";

import { getOwnerBusinessList } from "@/lib/owner/data";
import { logOwnerAction, requireOwnerAdminFromRequest } from "@/lib/owner/auth";

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  try {
    const auth = await requireOwnerAdminFromRequest(request);
    const url = new URL(request.url);

    const result = await getOwnerBusinessList({
      search: url.searchParams.get("search") || undefined,
      status: url.searchParams.get("status") || undefined,
      page: parsePositiveInt(url.searchParams.get("page"), 1),
      pageSize: parsePositiveInt(url.searchParams.get("pageSize"), 25),
      sortBy: (url.searchParams.get("sortBy") as "created_at" | "business_name" | "last_activity" | "bookings" | null) || undefined,
      sortDir: (url.searchParams.get("sortDir") as "asc" | "desc" | null) || undefined
    });

    await logOwnerAction("owner_businesses_read", "businesses", undefined, {
      search: url.searchParams.get("search") || null,
      status: url.searchParams.get("status") || "all",
      page: result.page,
      pageSize: result.pageSize
    }, {
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent
    });

    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
}
