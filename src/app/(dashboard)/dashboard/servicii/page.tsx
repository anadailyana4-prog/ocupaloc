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

  const selectAttempts = [
    ["id", "nume", "durata_minute", "pret", "activ", "is_featured"].join(", "),
    ["id", "nume", "durata_minute", "pret", "activ"].join(", ")
  ] as const;

  let rows:
    | Array<{ id: string; nume: string; durata_minute: number; pret: number; activ: boolean; is_featured?: boolean }>
    | null = null;
  let error: { message: string } | null = null;
  let supportsFeatured = false;

  for (const columns of selectAttempts) {
    const result = await supabase.from("servicii").select(columns).eq("profesionist_id", prof.id).order("nume", { ascending: true });

    if (!result.error) {
      rows = (result.data ?? null) as unknown as Array<{
        id: string;
        nume: string;
        durata_minute: number;
        pret: number;
        activ: boolean;
        is_featured?: boolean;
      }>;
      error = null;
      supportsFeatured = columns.includes("is_featured");
      break;
    }

    if (result.error.message.includes("is_featured")) {
      error = result.error;
      continue;
    }

    error = result.error;
    break;
  }

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
    is_featured: row.is_featured ?? false,
    deleted_at: null
  }));

  return <ServiciiManager initialServices={initialServices} orgSlug={prof.slug} supportsFeatured={supportsFeatured} />;
}
