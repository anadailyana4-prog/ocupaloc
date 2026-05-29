"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Afișează banner-ul „ești pe pagina ta publică" doar pentru proprietarul logat.
 * Verificarea se face client-side ca pagina publică să rămână cacheabilă (SEO/ISR).
 */
export function OwnerBanner({ profId }: { profId: string }) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user }
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("profesionisti")
          .select("id")
          .eq("user_id", user.id)
          .eq("id", profId)
          .maybeSingle();
        if (active && data) setIsOwner(true);
      } catch {
        /* anon / no session — nu afișăm banner-ul */
      }
    })();
    return () => {
      active = false;
    };
  }, [profId]);

  if (!isOwner) return null;

  return (
    <div className="flex items-center gap-3 border-b oc-border bg-white px-4 py-2">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-md border oc-border oc-badge-bg px-3 py-1.5 text-sm font-medium oc-text transition hover:bg-white"
      >
        ← Înapoi la meniu
      </Link>
      <span className="text-xs oc-secondary-text">Ești pe pagina ta publică</span>
    </div>
  );
}
