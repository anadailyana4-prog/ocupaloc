import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/config/env";

/** Doar pe server (route handlers, server actions). */
export function createSupabaseServiceClient() {
  const url = env.get("NEXT_PUBLIC_SUPABASE_URL");
  const key = env.get("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
