import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { reportError } from "@/lib/observability";

export type OwnerAdminUser = {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "viewer";
  is_active: boolean;
  created_at: string;
};

/**
 * Check if current user is owner or admin
 * Server-side verification via owner_admin_users table
 */
export async function isOwnerAdmin(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data, error } = await supabase
      .from("owner_admin_users")
      .select("id, role, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .in("role", ["owner", "admin"])
      .single();

    return !error && data !== null;
  } catch (e) {
    console.error("Error checking owner admin status:", e);
    return false;
  }
}

/**
 * Get current owner admin user details
 */
export async function getOwnerAdminUser(): Promise<OwnerAdminUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("owner_admin_users")
      .select("id, user_id, role, is_active, created_at")
      .eq("user_id", user.id)
      .single();

    if (error || !data) return null;

    return data as OwnerAdminUser;
  } catch (e) {
    console.error("Error fetching owner admin user:", e);
    return null;
  }
}

/**
 * Verify owner admin access server-side
 * Throws if not authorized
 */
export async function requireOwnerAdmin(): Promise<OwnerAdminUser> {
  const admin = await getOwnerAdminUser();
  
  if (!admin || !admin.is_active || !["owner", "admin"].includes(admin.role)) {
    throw new Error("Unauthorized: owner admin access required");
  }

  return admin;
}

/**
 * Log owner action to audit trail
 */
export async function logOwnerAction(
  action: string,
  resourceType?: string,
  resourceId?: string,
  metadata?: Record<string, unknown>,
  requestContext?: { ipAddress?: string | null; userAgent?: string | null }
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return;

  const isAdmin = await isOwnerAdmin();
  if (!isAdmin) return;

  const admin = createSupabaseServiceClient();
  const { error } = await admin.from("owner_audit_logs").insert({
    user_id: user.id,
    action,
    resource_type: resourceType || null,
    resource_id: resourceId || null,
    metadata: metadata || null,
    ip_address: requestContext?.ipAddress || null,
    user_agent: requestContext?.userAgent || null
  });

  if (error) {
    reportError("auth", "owner_audit_log_write_failed", error, {
      userId: user.id,
      action,
      resourceType: resourceType ?? null,
      resourceId: resourceId ?? null
    });
    throw new Error(`Owner audit log write failed: ${error.message}`);
  }
}

/**
 * Verify owner admin access from an API Request (bearer token or cookie session)
 */
export async function requireOwnerAdminFromRequest(
  request: Request
): Promise<{ admin: OwnerAdminUser; ipAddress: string | null; userAgent: string | null }> {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;
  const userAgent = request.headers.get("user-agent") || null;

  const admin = await getOwnerAdminUser();
  if (!admin || !admin.is_active || !("owner" === admin.role || "admin" === admin.role)) {
    throw new Error("Forbidden");
  }

  return { admin, ipAddress, userAgent };
}

/**
 * Track business activity event (used by business and owner portal)
 */
export async function trackBusinessActivity(
  profesionistId: string,
  eventType: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const admin = createSupabaseServiceClient();
    
    await admin.from("business_activity_events").insert({
      profesionist_id: profesionistId,
      event_type: eventType,
      metadata: metadata || null
    });
  } catch (e) {
    console.error("Error tracking business activity:", e);
    // Non-critical
  }
}

/**
 * Log cron job execution
 */
export async function logCronExecution(
  jobName: string,
  status: "success" | "failed" | "partial",
  durationMs?: number,
  itemsProcessed?: number,
  itemsFailed?: number,
  errorMessage?: string
): Promise<void> {
  try {
    const admin = createSupabaseServiceClient();
    
    await admin.from("cron_job_runs").insert({
      job_name: jobName,
      status,
      duration_ms: durationMs || null,
      items_processed: itemsProcessed || 0,
      items_failed: itemsFailed || 0,
      error_message: errorMessage || null
    });
  } catch (e) {
    console.error("Error logging cron execution:", e);
  }
}
