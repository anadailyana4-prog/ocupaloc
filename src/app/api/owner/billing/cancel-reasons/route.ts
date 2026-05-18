import { NextResponse } from "next/server";

import { BILLING_EVENT_TYPES } from "@/lib/ops-event-taxonomy";
import { logOwnerAction, requireOwnerAdminFromRequest } from "@/lib/owner/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CancelReasonEventRow = {
  created_at: string;
  metadata: {
    reason?: string;
    cancelType?: string;
  } | null;
};

const CANCEL_REASON_LABELS: Record<string, string> = {
  prea_scump: "Prețul este prea mare",
  lipsa_functii: "Lipsesc funcții importante",
  temporar_inchis: "Business închis temporar",
  suport: "Probleme suport/stabilitate",
  altul: "Alt motiv"
};

export async function GET(request: Request) {
  try {
    const auth = await requireOwnerAdminFromRequest(request);
    const supabase = await createSupabaseServerClient();

    const { searchParams } = new URL(request.url);
    const windowDaysRaw = Number(searchParams.get("windowDays") ?? "30");
    const windowDays = Number.isFinite(windowDaysRaw)
      ? Math.min(180, Math.max(1, Math.floor(windowDaysRaw)))
      : 30;

    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("operational_events")
      .select("created_at, metadata")
      .eq("flow", "billing")
      .eq("event_type", BILLING_EVENT_TYPES.SUBSCRIPTION_CANCELED)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const reasonCounter = new Map<string, number>();
    const cancelTypeCounter = new Map<string, number>();

    for (const row of (data ?? []) as CancelReasonEventRow[]) {
      const reason = String(row.metadata?.reason ?? "unknown").trim() || "unknown";
      const cancelType = String(row.metadata?.cancelType ?? "unspecified").trim() || "unspecified";

      reasonCounter.set(reason, (reasonCounter.get(reason) ?? 0) + 1);
      cancelTypeCounter.set(cancelType, (cancelTypeCounter.get(cancelType) ?? 0) + 1);
    }

    const reasonDistribution = Array.from(reasonCounter.entries())
      .map(([reason, count]) => ({
        reason,
        label: CANCEL_REASON_LABELS[reason] ?? reason,
        count
      }))
      .sort((a, b) => b.count - a.count);

    const cancelTypeDistribution = Array.from(cancelTypeCounter.entries())
      .map(([cancelType, count]) => ({ cancelType, count }))
      .sort((a, b) => b.count - a.count);

    await logOwnerAction("owner_billing_cancel_reasons_read", "billing", undefined, {
      windowDays,
      totalEvents: (data ?? []).length
    }, {
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent
    });

    return NextResponse.json({
      ok: true,
      data: {
        windowDays,
        totalEvents: (data ?? []).length,
        reasonDistribution,
        cancelTypeDistribution,
        generatedAt: new Date().toISOString()
      }
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
}
