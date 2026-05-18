import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BusinessStats = {
  total_accounts: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  canceled_subscriptions: number;
  expired_trials: number;
  total_bookings: number;
  bookings_last_24h: number;
  bookings_last_7d: number;
  bookings_last_30d: number;
  estimated_mrr: number;
  estimated_arr: number;
  total_locations: number;
  total_professionals: number;
  conversion_rate_trial_to_paid: number;
  successful_cron_jobs_last_24h: number;
  failed_cron_jobs_last_24h: number;
};

export type BusinessOverview = {
  id: string;
  user_id: string;
  nume_business: string;
  slug: string;
  email_contact: string;
  created_at: string;
  status: "trial" | "active" | "canceled" | "expired" | "no_subscription";
  trial_start?: string;
  trial_end?: string;
  subscription_status?: string;
  num_locations: number;
  num_bookings: number;
  last_activity_at?: string;
  has_issues: boolean;
};

/**
 * Get high-level business statistics for dashboard
 */
export async function getBusinessStats(): Promise<BusinessStats | null> {
  try {
    const supabase = await createSupabaseServerClient();

    // Total accounts
    const { count: totalAccounts } = await supabase
      .from("profesionisti")
      .select("id", { count: "exact", head: true });

    // Subscription stats
    const { data: subStats } = await supabase
      .from("subscriptions")
      .select("status, stripe_subscription_id")
      .throwOnError();

    const activeCount =
      subStats?.filter(s => s.status === "active" || s.status === "reactivated").length || 0;
    const trialCount =
      subStats?.filter(s => s.status === "trialing").length || 0;
    const canceledCount =
      subStats?.filter(s => s.status === "canceled").length || 0;

    // Bookings
    const { count: totalBookings } = await supabase
      .from("programari")
      .select("id", { count: "exact", head: true });

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { count: bookings24h } = await supabase
      .from("programari")
      .select("id", { count: "exact", head: true })
      .gte("created_at", last24h.toISOString());

    const { count: bookings7d } = await supabase
      .from("programari")
      .select("id", { count: "exact", head: true })
      .gte("created_at", last7d.toISOString());

    const { count: bookings30d } = await supabase
      .from("programari")
      .select("id", { count: "exact", head: true })
      .gte("created_at", last30d.toISOString());

    // Cron stats
    const { data: cronStats } = await supabase
      .from("cron_job_runs")
      .select("status")
      .gte("run_at", last24h.toISOString())
      .throwOnError();

    const successCrons =
      cronStats?.filter(c => c.status === "success").length || 0;
    const failedCrons =
      cronStats?.filter(c => c.status === "failed").length || 0;

    return {
      total_accounts: totalAccounts || 0,
      active_subscriptions: activeCount,
      trial_subscriptions: trialCount,
      canceled_subscriptions: canceledCount,
      expired_trials: 0, // Would need to query subscriptions with end_date < now
      total_bookings: totalBookings || 0,
      bookings_last_24h: bookings24h || 0,
      bookings_last_7d: bookings7d || 0,
      bookings_last_30d: bookings30d || 0,
      estimated_mrr: activeCount * 59.99, // Assuming 59.99 RON/month
      estimated_arr: activeCount * 59.99 * 12,
      total_locations: totalAccounts || 0,
      total_professionals: totalAccounts || 0,
      conversion_rate_trial_to_paid:
        trialCount > 0 ? (activeCount / (activeCount + trialCount)) * 100 : 0,
      successful_cron_jobs_last_24h: successCrons,
      failed_cron_jobs_last_24h: failedCrons
    };
  } catch (error) {
    console.error("Error fetching business stats:", error);
    return null;
  }
}

/**
 * Get list of all businesses with their status
 */
export async function getBusinessList(
  limit: number = 50,
  offset: number = 0,
  search?: string
): Promise<{ data: BusinessOverview[]; total: number } | null> {
  try {
    const supabase = await createSupabaseServerClient();

    let query = supabase
      .from("profesionisti")
      .select(
        "id, user_id, nume_business, slug, email_contact, created_at, last_activity_at",
        { count: "exact" }
      );

    if (search) {
      query = query.or(
        `nume_business.ilike.%${search}%,slug.ilike.%${search}%,email_contact.ilike.%${search}%`
      );
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Fetch subscription status for each business
    const { data: subData } = await supabase
      .from("subscriptions")
      .select("profesionist_id, status, current_period_end");

    const subMap = new Map(
      subData?.map(s => [s.profesionist_id, s]) || []
    );

    const businesses: BusinessOverview[] = (data || []).map((prof) => {
      const sub = subMap.get((prof.id as string));
      let status: "trial" | "active" | "canceled" | "expired" | "no_subscription" =
        "no_subscription";

      if (sub) {
        if (sub.status === "active" || sub.status === "reactivated") status = "active";
        else if (sub.status === "trialing") status = "trial";
        else if (sub.status === "canceled") status = "canceled";
        else status = "expired";
      }

      return {
        id: prof.id,
        user_id: prof.user_id,
        nume_business: prof.nume_business,
        slug: prof.slug,
        email_contact: prof.email_contact,
        created_at: prof.created_at,
        status,
        subscription_status: sub?.status,
        num_locations: 0, // Would need separate query to count
        num_bookings: 0,  // Would need separate query to count
        last_activity_at: prof.last_activity_at,
        has_issues: false // Could add logic to detect issues
      };
    });

    return {
      data: businesses,
      total: count || 0
    };
  } catch (error) {
    console.error("Error fetching business list:", error);
    return null;
  }
}

/**
 * Get detailed view of a single business
 */
export async function getBusinessDetail(businessId: string) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: prof, error: profError } = await supabase
      .from("profesionisti")
      .select("*")
      .eq("id", businessId)
      .single();

    if (profError || !prof) return null;

    // Subscriptions
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("profesionist_id", businessId);

    // Services
    const { data: services, count: servicesCount } = await supabase
      .from("servicii")
      .select("*", { count: "exact" })
      .eq("profesionist_id", businessId);

    // Recent bookings
    const { data: recentBookings, count: bookingsCount } = await supabase
      .from("programari")
      .select("*", { count: "exact" })
      .eq("profesionist_id", businessId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Activity events
    const { data: activityEvents } = await supabase
      .from("business_activity_events")
      .select("*")
      .eq("profesionist_id", businessId)
      .order("created_at", { ascending: false })
      .limit(30);

    // Owner notes
    const { data: notes } = await supabase
      .from("owner_notes")
      .select("*")
      .eq("profesionist_id", businessId)
      .order("created_at", { ascending: false });

    return {
      business: prof,
      subscriptions: subs || [],
      services: services || [],
      servicesCount,
      recentBookings: recentBookings || [],
      bookingsCount,
      activityEvents: activityEvents || [],
      notes: notes || []
    };
  } catch (error) {
    console.error("Error fetching business detail:", error);
    return null;
  }
}

/**
 * Get subscription overview
 */
export async function getSubscriptionOverview() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data } = await supabase
      .from("subscriptions")
      .select(
        `
        id,
        profesionist_id,
        status,
        current_period_end,
        stripe_subscription_id,
        profesionisti(nume_business, email_contact)
      `
      )
      .order("current_period_end", { ascending: true });

    return data || [];
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return [];
  }
}

/**
 * Get recently failed cron jobs
 */
export async function getFailedCronJobs(limit: number = 20) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data } = await supabase
      .from("cron_job_runs")
      .select("*")
      .eq("status", "failed")
      .order("run_at", { ascending: false })
      .limit(limit);

    return data || [];
  } catch (error) {
    console.error("Error fetching failed cron jobs:", error);
    return [];
  }
}
