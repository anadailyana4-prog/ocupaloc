import { createClient } from "@supabase/supabase-js";

/** Doar pe server (route handlers, server actions). */
export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Lipsește SUPABASE_SERVICE_ROLE_KEY pentru operații privilegiate.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
