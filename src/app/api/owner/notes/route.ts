import { NextResponse } from "next/server";

import { logOwnerAction, requireOwnerAdminFromRequest } from "@/lib/owner/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type NoteBody = {
  profesionistId?: unknown;
  content?: unknown;
  tags?: unknown;
};

const ALLOWED_TAGS = new Set(["hot_lead", "churn_risk", "VIP", "needs_help", "follow_up"]);

export async function GET(request: Request) {
  try {
    const auth = await requireOwnerAdminFromRequest(request);
    const url = new URL(request.url);
    const profesionistId = url.searchParams.get("profesionistId")?.trim();

    const supabase = await createSupabaseServerClient();
    let query = supabase.from("owner_notes").select("*").order("created_at", { ascending: false }).limit(200);

    if (profesionistId) {
      query = query.eq("profesionist_id", profesionistId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ ok: false, error: "Failed to load notes" }, { status: 500 });
    }

    await logOwnerAction("owner_notes_read", "owner_notes", profesionistId || undefined, undefined, {
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent
    });

    return NextResponse.json({ ok: true, notes: data ?? [] });
  } catch {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireOwnerAdminFromRequest(request);
    const body = (await request.json().catch(() => ({}))) as NoteBody;

    const profesionistId = String(body.profesionistId ?? "").trim();
    const content = String(body.content ?? "").trim();

    if (!profesionistId || !content) {
      return NextResponse.json({ ok: false, error: "profesionistId and content are required" }, { status: 400 });
    }

    const tags = Array.isArray(body.tags)
      ? body.tags.map((t) => String(t)).filter((t) => ALLOWED_TAGS.has(t))
      : [];

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("owner_notes")
      .insert({
        profesionist_id: profesionistId,
        content,
        tags,
        created_by: auth.admin.user_id
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: "Failed to create note" }, { status: 500 });
    }

    await logOwnerAction("owner_note_create", "owner_notes", String(data.id), {
      profesionistId,
      tagsCount: tags.length
    }, {
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent
    });

    return NextResponse.json({ ok: true, note: data }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
}
