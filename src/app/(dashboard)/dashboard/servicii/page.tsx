import { redirect } from "next/navigation";

import { ServiciiManager, type ServiciuListRow } from "./servicii-manager";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ServiciiDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: prof } = await supabase.from("profesionisti").select("id, slug").eq("user_id", user.id).maybeSingle();
  if (!prof?.id || !prof.slug) {
    redirect("/onboarding");
  }

  const { data: rows, error } = await supabase
    .from("servicii")
    .select("id, nume, durata_minute, pret, activ")
    .eq("profesionist_id", prof.id)
    .order("nume", { ascending: true });

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 p-4 text-sm text-destructive">
        Nu am putut încărca serviciile: {error.message}
      </div>
    );
  }

  const initialServices: ServiciuListRow[] = (rows ?? []).map((row) => ({
    id: row.id,
    name: row.nume,
    duration_min: row.durata_minute,
    price: row.pret,
    is_active: row.activ,
    deleted_at: null
  }));

  return <ServiciiManager initialServices={initialServices} orgSlug={prof.slug} />;
}
