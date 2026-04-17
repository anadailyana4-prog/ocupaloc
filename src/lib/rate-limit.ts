import type { SupabaseClient } from "@supabase/supabase-js";

type CheckRateLimitResult = {
  allowed: boolean;
};

export async function checkApiRateLimit(
  admin: SupabaseClient,
  key: string,
  maxRequests: number,
  windowMs: number,
  options?: { failOpen?: boolean }
): Promise<CheckRateLimitResult> {
  const failOpen = options?.failOpen ?? false;
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));

  const { data, error } = await admin.rpc("check_rate_limit", {
    p_key: key,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds
  });

  if (error) {
    console.error("[rate-limit]", error.message);
    return { allowed: failOpen };
  }

  return { allowed: Boolean(data) };
}
