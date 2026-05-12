import { NextResponse } from "next/server";

import { logOwnerAction, requireOwnerAdminFromRequest } from "@/lib/owner/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type UpdateNoteBody = {
  content?: unknown;
  tags?: unknown;
};

const ALLOWED_TAGS = new Set(["hot_lead", "churn_risk", "VIP", "needs_help", "follow_up"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireOwnerAdminFromRequest(request);
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as UpdateNoteBody;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (typeof body.content === "string" && body.content.trim().length > 0) {
      updates.content = body.content.trim();
    }

    if (Array.isArray(body.tags)) {
      updates.tags = body.tags.map((t) => String(t)).filter((t) => ALLOWED_TAGS.has(t));
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("owner_notes")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: "Failed to update note" }, { status: 500 });
    }

    await logOwnerAction("owner_note_update", "owner_notes", id, undefined, {
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent
    });

    return NextResponse.json({ ok: true, note: data });
  } catch {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireOwnerAdminFromRequest(request);
    const { id } = await params;

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("owner_notes").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ ok: false, error: "Failed to delete note" }, { status: 500 });
    }

    await logOwnerAction("owner_note_delete", "owner_notes", id, undefined, {
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
}
