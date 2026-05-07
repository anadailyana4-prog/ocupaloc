import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export type IdempotencyResultPayload = Record<string, unknown>;

function resolveAdmin(admin?: SupabaseClient): SupabaseClient {
  return admin ?? createSupabaseServiceClient();
}

export async function findIdempotencyResult(
  key: string,
  admin?: SupabaseClient
): Promise<IdempotencyResultPayload | null> {
  const db = resolveAdmin(admin);
  const { data, error } = await db
    .from("idempotencykeys")
    .select("result")
    .eq("key", key)
    .gt("expiresat", new Date().toISOString())
    .maybeSingle();

  if (error) {
    throw new Error(`idempotency lookup failed: ${error.message}`);
  }

  return (data?.result as IdempotencyResultPayload | undefined) ?? null;
}

export async function saveIdempotencyResult(
  key: string,
  result: IdempotencyResultPayload,
  admin?: SupabaseClient
): Promise<void> {
  const db = resolveAdmin(admin);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await db
    .from("idempotencykeys")
    .upsert(
      {
        key,
        result,
        expiresat: expiresAt
      },
      { onConflict: "key" }
    );

  if (error) {
    throw new Error(`idempotency save failed: ${error.message}`);
  }
}