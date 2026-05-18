import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_PLAN_PRICE_RON = 59.99;

export function deriveOwnerKpiMetrics(input: {
  activeSubs: number;
  trialActive: number;
  bookings30d: number;
}) {
  const mrrRon = Number((input.activeSubs * DEFAULT_PLAN_PRICE_RON).toFixed(2));
  const arrRon = Number((mrrRon * 12).toFixed(2));
  const trialToPaidConversionPct =
    input.trialActive + input.activeSubs > 0
      ? Number(((input.activeSubs / (input.trialActive + input.activeSubs)) * 100).toFixed(2))
      : 0;

  return {
    mrrRon,
    monthlyRevenueRon: mrrRon,
    arrRon,
    trialToPaidConversionPct,
    bookingsPerDay: Number(((input.bookings30d / 30) || 0).toFixed(2)),
    bookingsPerWeek: Number(((input.bookings30d / 4.29) || 0).toFixed(2)),
    bookingsPerMonth: input.bookings30d
  };
}

type SubscriptionRow = {
  profesionist_id: string;
  status: string;
  current_period_end: string | null;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  cancel_at_period_end: boolean;
};

type BusinessRow = {
  id: string;
  user_id: string;
  nume_business: string;
  slug: string;
  email_contact: string | null;
  created_at: string;
  last_activity_at: string | null;
  onboarding_completed_at: string | null;
  first_booking_at: string | null;
};

export type OwnerKpiStats = {
  totalAccounts: number;
  activeAccounts: number;
  trialActive: number;
  trialExpired: number;
  subscriptionsActive: number;
  subscriptionsCanceled: number;
  mrrRon: number;
  arrRon: number;
  monthlyRevenueRon: number;
  invoicedRevenue30dRon: number | null;
  totalBusinesses: number;
  bookingsTotal: number;
  bookings24h: number;
  bookings7d: number;
  bookings30d: number;
  trialToPaidConversionPct: number;
  bookingsPerDay: number;
  bookingsPerWeek: number;
  bookingsPerMonth: number;
  cronSuccess24h: number;
  cronFail24h: number;
  emailsSent24h: number;
  emailsFailed24h: number;
  bookingErrorRate7dPct: number | null;
  recentCriticalErrors: Array<{ id: number; eventType: string; createdAt: string; metadata: Record<string, unknown> }>;
  syntheticMonitorStatus: "healthy" | "failing" | "not_instrumented_yet";
  deploymentStatus: "not_instrumented_yet";
  commercialMetricClassification: {
    mrrRon: "estimated";
    monthlyRevenueRon: "estimated";
    arrRon: "derived";
    invoicedRevenue30dRon: "billed";
    trialToPaidConversionPct: "derived";
  };
  commercialMetricNotes: string[];
  notInstrumented: string[];
};

export type BusinessListItem = {
  id: string;
  businessName: string;
  ownerEmail: string | null;
  slug: string;
  createdAt: string;
  status: "trial" | "paid" | "canceled" | "expired" | "no_subscription";
  trialExpiry: string | null;
  currentPlan: string;
  locationsCount: number;
  bookingsCount: number;
  lastActivity: string | null;
  recentEmailActivity: boolean;
  recentIssue: boolean;
  subscriptionActive: boolean;
};

export type BusinessListParams = {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "created_at" | "business_name" | "last_activity" | "bookings";
  sortDir?: "asc" | "desc";
};

function deriveBusinessStatus(subscription: SubscriptionRow | undefined): BusinessListItem["status"] {
  if (!subscription) return "no_subscription";
  if (subscription.status === "active" || subscription.status === "reactivated") return "paid";
  if (subscription.status === "trialing") {
    if (subscription.current_period_end && new Date(subscription.current_period_end) < new Date()) {
      return "expired";
    }
    return "trial";
  }
  if (subscription.status === "canceled") return "canceled";
  return "expired";
}

export async function getOwnerKpis(): Promise<OwnerKpiStats> {
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: totalAccounts }, { data: businesses }, { data: subscriptions }] = await Promise.all([
    supabase.from("profesionisti").select("id", { head: true, count: "exact" }),
    supabase
      .from("profesionisti")
      .select("id, onboarding_completed_at"),
    supabase
      .from("subscriptions")
      .select("profesionist_id, status, current_period_end, stripe_subscription_id, stripe_customer_id, cancel_at_period_end")
  ]);

  const subRows = (subscriptions ?? []) as SubscriptionRow[];
  const activeSubs = subRows.filter((s) => s.status === "active" || s.status === "reactivated").length;
  const canceledSubs = subRows.filter((s) => s.status === "canceled").length;
  const trialSubs = subRows.filter((s) => s.status === "trialing");
  const trialActive = trialSubs.filter((s) => !s.current_period_end || new Date(s.current_period_end) >= now).length;
  const trialExpired = trialSubs.filter((s) => s.current_period_end && new Date(s.current_period_end) < now).length;

  const [{ count: bookingsTotal }, { count: bookings24h }, { count: bookings7d }, { count: bookings30d }] = await Promise.all([
    supabase.from("programari").select("id", { head: true, count: "exact" }),
    supabase.from("programari").select("id", { head: true, count: "exact" }).gte("created_at", last24h),
    supabase.from("programari").select("id", { head: true, count: "exact" }).gte("created_at", last7d),
    supabase.from("programari").select("id", { head: true, count: "exact" }).gte("created_at", last30d)
  ]);

  const [{ data: cronRuns }, { data: emailRows }, { data: opEvents }, { data: syntheticRows }] = await Promise.all([
    supabase.from("cron_job_runs").select("status").gte("run_at", last24h),
    supabase.from("email_queue").select("status").gte("created_at", last24h),
    supabase.from("operational_events").select("id, event_type, outcome, flow, created_at, metadata").gte("created_at", last7d),
    supabase
      .from("operational_events")
      .select("outcome, created_at")
      .eq("flow", "synthetic")
      .order("created_at", { ascending: false })
      .limit(1)
  ]);

  const cronSuccess24h = (cronRuns ?? []).filter((row) => row.status === "success").length;
  const cronFail24h = (cronRuns ?? []).filter((row) => row.status === "failed").length;
  const emailsSent24h = (emailRows ?? []).filter((row) => row.status === "sent").length;
  const emailsFailed24h = (emailRows ?? []).filter((row) => row.status === "failed").length;

  const bookingEvents7d = (opEvents ?? []).filter((row) => row.flow === "booking");
  const bookingFailures7d = bookingEvents7d.filter((row) => row.outcome === "failure").length;
  const bookingErrorRate7dPct = bookingEvents7d.length > 0 ? Number(((bookingFailures7d / bookingEvents7d.length) * 100).toFixed(2)) : null;

  const recentCriticalErrors = (opEvents ?? [])
    .filter((row) => row.outcome === "failure")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map((row) => ({
      id: row.id,
      eventType: row.event_type,
      createdAt: row.created_at,
      metadata: (row.metadata as Record<string, unknown>) ?? {}
    }));

  const syntheticMonitorStatus: OwnerKpiStats["syntheticMonitorStatus"] =
    !syntheticRows || syntheticRows.length === 0
      ? "not_instrumented_yet"
      : syntheticRows[0]?.outcome === "success"
        ? "healthy"
        : "failing";

  const activeBusinessIds = new Set(
    subRows
      .filter((s) => s.status === "active" || s.status === "reactivated")
      .map((s) => s.profesionist_id)
  );
  const activeAccounts = (businesses ?? []).filter((b) => activeBusinessIds.has(String(b.id))).length;
  const totalBusinesses = totalAccounts ?? 0;
  const derived = deriveOwnerKpiMetrics({
    activeSubs,
    trialActive,
    bookings30d: bookings30d ?? 0
  });

  return {
    totalAccounts: totalBusinesses,
    activeAccounts,
    trialActive,
    trialExpired,
    subscriptionsActive: activeSubs,
    subscriptionsCanceled: canceledSubs,
    mrrRon: derived.mrrRon,
    monthlyRevenueRon: derived.monthlyRevenueRon,
    arrRon: derived.arrRon,
    invoicedRevenue30dRon: null,
    totalBusinesses,
    bookingsTotal: bookingsTotal ?? 0,
    bookings24h: bookings24h ?? 0,
    bookings7d: bookings7d ?? 0,
    bookings30d: bookings30d ?? 0,
    trialToPaidConversionPct: derived.trialToPaidConversionPct,
    bookingsPerDay: derived.bookingsPerDay,
    bookingsPerWeek: derived.bookingsPerWeek,
    bookingsPerMonth: derived.bookingsPerMonth,
    cronSuccess24h,
    cronFail24h,
    emailsSent24h,
    emailsFailed24h,
    bookingErrorRate7dPct,
    recentCriticalErrors,
    syntheticMonitorStatus,
    deploymentStatus: "not_instrumented_yet",
    commercialMetricClassification: {
      mrrRon: "estimated",
      monthlyRevenueRon: "estimated",
      arrRon: "derived",
      invoicedRevenue30dRon: "billed",
      trialToPaidConversionPct: "derived"
    },
    commercialMetricNotes: [
      "MRR/Monthly Revenue sunt estimate din abonamente active * preț listă.",
      "ARR este derivat din MRR estimat (MRR * 12).",
      "Venitul facturat Stripe nu este încă instrumentat în acest dashboard."
    ],
    notInstrumented: [
      "deployment_status",
      "invoiced_revenue_stripe",
      "business_email_activity_flag",
      "multi_location_model"
    ]
  };
}

export async function getOwnerBusinessList(params: BusinessListParams) {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, params.pageSize ?? 25));
  const sortBy = params.sortBy ?? "created_at";
  const sortDir = params.sortDir ?? "desc";

  const { data: businesses } = await supabase
    .from("profesionisti")
    .select(
      "id, user_id, nume_business, slug, email_contact, created_at, last_activity_at, onboarding_completed_at, first_booking_at"
    );

  const businessRows = ((businesses ?? []) as BusinessRow[]).filter((row) => {
    if (!params.search) return true;
    const needle = params.search.toLowerCase();
    return (
      row.nume_business.toLowerCase().includes(needle) ||
      row.slug.toLowerCase().includes(needle) ||
      (row.email_contact ?? "").toLowerCase().includes(needle)
    );
  });

  const ids = businessRows.map((row) => row.id);
  const [subRes, bookingRes, issueRes] = await Promise.all([
    ids.length
      ? supabase
          .from("subscriptions")
          .select("profesionist_id, status, current_period_end, stripe_subscription_id, stripe_customer_id, cancel_at_period_end")
          .in("profesionist_id", ids)
      : Promise.resolve({ data: [] as SubscriptionRow[] }),
    ids.length ? supabase.from("programari").select("profesionist_id, created_at").in("profesionist_id", ids) : Promise.resolve({ data: [] as Array<{ profesionist_id: string; created_at: string }> }),
    ids.length
      ? supabase
          .from("operational_events")
          .select("entity_id, outcome, created_at")
          .eq("outcome", "failure")
          .gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      : Promise.resolve({ data: [] as Array<{ entity_id: string | null; outcome: string; created_at: string }> })
  ]);

  const subMap = new Map<string, SubscriptionRow>();
  for (const sub of (subRes.data ?? []) as SubscriptionRow[]) {
    if (!subMap.has(sub.profesionist_id)) {
      subMap.set(sub.profesionist_id, sub);
    }
  }

  const bookingMap = new Map<string, { count: number; last: string | null }>();
  for (const row of bookingRes.data ?? []) {
    const current = bookingMap.get(row.profesionist_id) ?? { count: 0, last: null };
    current.count += 1;
    if (!current.last || new Date(row.created_at) > new Date(current.last)) {
      current.last = row.created_at;
    }
    bookingMap.set(row.profesionist_id, current);
  }

  const issueSet = new Set(
    (issueRes.data ?? [])
      .map((row) => row.entity_id)
      .filter((value): value is string => Boolean(value))
  );

  let items: BusinessListItem[] = businessRows.map((row) => {
    const subscription = subMap.get(row.id);
    const bookingAgg = bookingMap.get(row.id);
    const trialExpiry = subscription?.status === "trialing" ? subscription.current_period_end : null;
    const derivedStatus = deriveBusinessStatus(subscription);

    return {
      id: row.id,
      businessName: row.nume_business,
      ownerEmail: row.email_contact,
      slug: row.slug,
      createdAt: row.created_at,
      status: derivedStatus,
      trialExpiry,
      currentPlan:
        subscription?.status === "active" || subscription?.status === "reactivated"
          ? "Professional"
          : subscription?.status === "trialing"
            ? "Trial"
            : "N/A",
      locationsCount: 1,
      bookingsCount: bookingAgg?.count ?? 0,
      lastActivity: row.last_activity_at ?? bookingAgg?.last ?? null,
      recentEmailActivity: false,
      recentIssue: issueSet.has(row.id),
      subscriptionActive: subscription?.status === "active" || subscription?.status === "reactivated"
    };
  });

  if (params.status && params.status !== "all") {
    items = items.filter((item) => item.status === params.status);
  }

  items.sort((a, b) => {
    let left: string | number = "";
    let right: string | number = "";
    if (sortBy === "created_at") {
      left = new Date(a.createdAt).getTime();
      right = new Date(b.createdAt).getTime();
    }
    if (sortBy === "business_name") {
      left = a.businessName.toLowerCase();
      right = b.businessName.toLowerCase();
    }
    if (sortBy === "last_activity") {
      left = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
      right = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
    }
    if (sortBy === "bookings") {
      left = a.bookingsCount;
      right = b.bookingsCount;
    }

    if (left === right) return 0;
    const comparison = left > right ? 1 : -1;
    return sortDir === "asc" ? comparison : -comparison;
  });

  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    items: paged
  };
}

export async function getOwnerBusinessDetail(businessId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: business }, { data: subscriptions }, { data: services }, { data: bookings }, { data: activityEvents }, { data: notes }] = await Promise.all([
    supabase.from("profesionisti").select("*").eq("id", businessId).maybeSingle(),
    supabase.from("subscriptions").select("*").eq("profesionist_id", businessId).order("created_at", { ascending: false }),
    supabase.from("servicii").select("*").eq("profesionist_id", businessId).order("created_at", { ascending: false }),
    supabase.from("programari").select("*").eq("profesionist_id", businessId).order("created_at", { ascending: false }).limit(50),
    supabase.from("business_activity_events").select("*").eq("profesionist_id", businessId).order("created_at", { ascending: false }).limit(100),
    supabase.from("owner_notes").select("*").eq("profesionist_id", businessId).order("created_at", { ascending: false })
  ]);

  if (!business) {
    return null;
  }

  return {
    business,
    subscriptions: subscriptions ?? [],
    services: services ?? [],
    recentBookings: bookings ?? [],
    activityTimeline: activityEvents ?? [],
    ownerNotes: notes ?? [],
    instrumentation: {
      emailHistory: false,
      incidents: true,
      usageTrends: true
    }
  };
}
