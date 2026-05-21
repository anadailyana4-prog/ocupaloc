import Link from "next/link";
import { redirect } from "next/navigation";

import { logOwnerAction, requireOwnerAdmin } from "@/lib/owner/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OwnerInternalNotesPage() {
  try {
    await requireOwnerAdmin();
    await logOwnerAction("view_section", "internal_notes");
  } catch {
    redirect("/owner/login");
  }

  const supabase = await createSupabaseServerClient();
  const { data: notes } = await supabase
    .from("owner_notes")
    .select("id, profesionist_id, content, tags, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Internal Notes</h1>
        <p className="text-slate-400 mt-1">Owner-only CRM notes, never visible to customers</p>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/20 divide-y divide-slate-700">
        {(notes ?? []).length === 0 ? (
          <p className="p-5 text-slate-400">No notes yet.</p>
        ) : (
          (notes ?? []).map((note) => (
            <div key={note.id} className="p-4">
              <p className="text-slate-100 text-sm">{note.content}</p>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex gap-2">
                  {(note.tags ?? []).map((tag: string) => (
                    <span key={tag} className="text-xs px-2 py-1 rounded bg-oc-amber/10 text-oc-amber-light border border-oc-amber/20">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-slate-500">
                  <Link className="text-oc-amber-light hover:text-oc-amber" href={`/owner/businesses/${note.profesionist_id}`}>
                    Open business
                  </Link>
                  <span className="mx-2">•</span>
                  {new Date(note.created_at).toLocaleDateString("ro-RO")}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
