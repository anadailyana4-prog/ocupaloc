import { createSupabasePublicClient } from "@/lib/supabase/server";
import { cityDisplay } from "@/lib/seo/local-service-pages";

/** Număr aproximativ de profiluri publice dintr-un oraș (pentru noindex pe pagini goale). */
export async function countPublicProfilesInCity(citySlug: string): Promise<number> {
  const orasName = cityDisplay(citySlug);
  try {
    const supabase = createSupabasePublicClient();
    const { count } = await supabase
      .from("profesionisti_public")
      .select("slug", { count: "exact", head: true })
      .ilike("oras", `%${orasName}%`)
      .not("slug", "is", null);
    return count ?? 0;
  } catch {
    return 0;
  }
}
