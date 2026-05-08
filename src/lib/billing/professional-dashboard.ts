import type { SupabaseClient } from "@supabase/supabase-js";

import { BILLING_PRICE_RON, BILLING_TRIAL_DAYS, isBillingEnabled } from "@/lib/billing/config";
import { getStripeClient } from "@/lib/billing/stripe";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type ProfessionalContext = {
  id: string;
  slug: string | null;
  businessName: string | null;
  createdAt: string | null;
};

type SubscriptionRow = {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
};

type PaidInvoice = {
  amountPaid: number;
  createdAt: Date;
};

type LoadProfessionalBillingDeps = {
  now?: Date;
  admin?: SupabaseClient;
  billingEnabled?: boolean;
  resolveProfessionalContext?: (userId: string, admin: SupabaseClient) => Promise<ProfessionalContext | null>;
  loadLatestSubscription?: (profesionistId: string, admin: SupabaseClient) => Promise<SubscriptionRow | null>;
  countRelevantBookings?: (input: { profesionistId: string; fromIso: string; toIso: string; admin: SupabaseClient }) => Promise<number>;
  listPaidInvoices?: (input: { stripeSubscriptionId: string | null; stripeCustomerId: string | null; sinceEpochSeconds: number }) => Promise<PaidInvoice[]>;
};

export type ProfessionalBillingModel = {
  businessName: string;
  planName: string;
  status: "active" | "trialing" | "trial" | "past_due" | "canceled" | "incomplete" | "paused" | "none" | "disabled";
  statusLabel: string;
  statusMessage: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  revenueCurrentMonth: number;
  revenuePreviousMonth: number;
  revenueDeltaPercent: number | null;
  bookingsCurrentMonth: number;
  bookingsPreviousMonth: number;
  trendLabels: string[];
  trendValues: number[];
  providerWarning: string | null;
  canOpenCheckout: boolean;
  canOpenPortal: boolean;
  canCancelSubscription: boolean;
};

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function nextMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("ro-RO", { month: "short", year: "2-digit" });
}

function safeDelta(current: number, previous: number): number | null {
  if (current === 0 && previous === 0) return null;
  if (previous <= 0) return 100;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

function trialDaysLeft(createdAt: string | null, now: Date): number {
  if (!createdAt) return 0;
  const startedAt = new Date(createdAt).getTime();
  const trialEnd = startedAt + BILLING_TRIAL_DAYS * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((trialEnd - now.getTime()) / (24 * 60 * 60 * 1000)));
}

function defaultModel(): ProfessionalBillingModel {
  const now = new Date();
  const trendLabels: string[] = [];
  const trendValues: number[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trendLabels.push(monthLabel(d));
    trendValues.push(0);
  }

  return {
    businessName: "Salonul tău",
    planName: `OcupaLoc Professional · ${BILLING_PRICE_RON} RON/lună`,
    status: "none",
    statusLabel: "Fără abonament",
    statusMessage: "Nu există încă un abonament activ pentru acest cont.",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    revenueCurrentMonth: 0,
    revenuePreviousMonth: 0,
    revenueDeltaPercent: null,
    bookingsCurrentMonth: 0,
    bookingsPreviousMonth: 0,
    trendLabels,
    trendValues,
    providerWarning: null,
    canOpenCheckout: true,
    canOpenPortal: false,
    canCancelSubscription: false
  };
}

function toStatusModel(input: {
  subscription: SubscriptionRow | null;
  createdAt: string | null;
  now: Date;
  billingEnabled: boolean;
}): Pick<ProfessionalBillingModel, "status" | "statusLabel" | "statusMessage" | "currentPeriodEnd" | "cancelAtPeriodEnd" | "canOpenCheckout" | "canOpenPortal" | "canCancelSubscription"> {
  if (!input.billingEnabled) {
    return {
      status: "disabled",
      statusLabel: "Billing dezactivat",
      statusMessage: "Billing nu este configurat în acest mediu.",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      canOpenCheckout: false,
      canOpenPortal: false,
      canCancelSubscription: false
    };
  }

  const sub = input.subscription;
  if (!sub) {
    const daysLeft = trialDaysLeft(input.createdAt, input.now);
    if (daysLeft > 0) {
      return {
        status: "trial",
        statusLabel: "Trial",
        statusMessage: `Ești în perioada de trial. Mai ai ${daysLeft} ${daysLeft === 1 ? "zi" : "zile"}.`,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        canOpenCheckout: true,
        canOpenPortal: false,
        canCancelSubscription: false
      };
    }

    return {
      status: "none",
      statusLabel: "Fără abonament",
      statusMessage: "Nu există un abonament activ. Poți porni checkout-ul din butonul de mai jos.",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      canOpenCheckout: true,
      canOpenPortal: false,
      canCancelSubscription: false
    };
  }

  const cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
  const currentPeriodEnd = sub.current_period_end ?? null;

  switch (sub.status) {
    case "active":
      return {
        status: "active",
        statusLabel: "Activ",
        statusMessage: cancelAtPeriodEnd
          ? "Abonamentul este activ, dar va fi oprit la finalul perioadei curente."
          : "Abonamentul este activ și se reînnoiește automat.",
        currentPeriodEnd,
        cancelAtPeriodEnd,
        canOpenCheckout: false,
        canOpenPortal: true,
        canCancelSubscription: !cancelAtPeriodEnd
      };
    case "trialing":
      return {
        status: "trialing",
        statusLabel: "Trial Stripe",
        statusMessage: cancelAtPeriodEnd
          ? "Trial activ, dar setat să se oprească la finalul perioadei curente."
          : "Trial activ în Stripe.",
        currentPeriodEnd,
        cancelAtPeriodEnd,
        canOpenCheckout: false,
        canOpenPortal: true,
        canCancelSubscription: !cancelAtPeriodEnd
      };
    case "past_due":
      return {
        status: "past_due",
        statusLabel: "Plată restantă",
        statusMessage: "Există o problemă de plată. Intră în portalul de billing pentru a actualiza metoda de plată.",
        currentPeriodEnd,
        cancelAtPeriodEnd,
        canOpenCheckout: false,
        canOpenPortal: true,
        canCancelSubscription: false
      };
    case "canceled":
      return {
        status: "canceled",
        statusLabel: "Anulat",
        statusMessage: "Abonamentul a fost anulat. Poți porni din nou checkout-ul pentru reactivare.",
        currentPeriodEnd,
        cancelAtPeriodEnd,
        canOpenCheckout: true,
        canOpenPortal: false,
        canCancelSubscription: false
      };
    case "incomplete":
      return {
        status: "incomplete",
        statusLabel: "Plată incompletă",
        statusMessage: "Checkout-ul nu a fost finalizat. Repornește plata sau verifică portalul de billing.",
        currentPeriodEnd,
        cancelAtPeriodEnd,
        canOpenCheckout: true,
        canOpenPortal: true,
        canCancelSubscription: false
      };
    case "paused":
      return {
        status: "paused",
        statusLabel: "Pausat",
        statusMessage: "Abonamentul este pus pe pauză. Verifică portalul de billing pentru reactivare.",
        currentPeriodEnd,
        cancelAtPeriodEnd,
        canOpenCheckout: true,
        canOpenPortal: true,
        canCancelSubscription: false
      };
    default:
      return {
        status: "none",
        statusLabel: "Fără abonament",
        statusMessage: "Nu există un abonament activ pentru acest cont.",
        currentPeriodEnd,
        cancelAtPeriodEnd,
        canOpenCheckout: true,
        canOpenPortal: false,
        canCancelSubscription: false
      };
  }
}

async function defaultResolveProfessionalContext(userId: string, admin: SupabaseClient): Promise<ProfessionalContext | null> {
  let { data: prof, error } = await admin
    .from("profesionisti")
    .select("id, slug, nume_business, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if ((!prof || error) && userId) {
    const { data: membership } = await admin
      .from("memberships")
      .select("tenant_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (membership?.tenant_id) {
      const fallback = await admin
        .from("profesionisti")
        .select("id, slug, nume_business, created_at")
        .eq("id", membership.tenant_id)
        .maybeSingle();
      if (!fallback.error && fallback.data) {
        prof = fallback.data;
        error = null;
      }
    }
  }

  if (error || !prof?.id) return null;

  return {
    id: prof.id,
    slug: prof.slug ?? null,
    businessName: prof.nume_business ?? null,
    createdAt: prof.created_at ?? null
  };
}

async function defaultLoadLatestSubscription(profesionistId: string, admin: SupabaseClient): Promise<SubscriptionRow | null> {
  const { data, error } = await admin
    .from("subscriptions")
    .select("status, current_period_end, cancel_at_period_end, stripe_subscription_id, stripe_customer_id")
    .eq("profesionist_id", profesionistId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if ((error?.code ?? "") === "PGRST205") {
    return null;
  }

  if (error || !data) return null;
  return data as SubscriptionRow;
}

async function defaultCountRelevantBookings(input: { profesionistId: string; fromIso: string; toIso: string; admin: SupabaseClient }): Promise<number> {
  const { count } = await input.admin
    .from("programari")
    .select("id", { count: "exact", head: true })
    .eq("profesionist_id", input.profesionistId)
    .neq("status", "anulat")
    .gte("data_start", input.fromIso)
    .lt("data_start", input.toIso);

  return count ?? 0;
}

async function defaultListPaidInvoices(input: { stripeSubscriptionId: string | null; stripeCustomerId: string | null; sinceEpochSeconds: number }): Promise<PaidInvoice[]> {
  if (!input.stripeSubscriptionId && !input.stripeCustomerId) {
    return [];
  }

  const stripe = getStripeClient();
  const invoices: PaidInvoice[] = [];
  const params: {
    status: "paid";
    limit: number;
    created: { gte: number };
    subscription?: string;
    customer?: string;
  } = {
    status: "paid",
    limit: 100,
    created: { gte: input.sinceEpochSeconds }
  };

  if (input.stripeSubscriptionId) {
    params.subscription = input.stripeSubscriptionId;
  } else if (input.stripeCustomerId) {
    params.customer = input.stripeCustomerId;
  }

  for await (const inv of stripe.invoices.list(params)) {
    invoices.push({
      amountPaid: (inv.amount_paid ?? 0) / 100,
      createdAt: new Date(inv.created * 1000)
    });
    if (invoices.length >= 5000) break;
  }

  return invoices;
}

export async function loadProfessionalBillingModel(userId: string, deps: LoadProfessionalBillingDeps = {}): Promise<ProfessionalBillingModel | null> {
  const now = deps.now ?? new Date();
  const billingEnabled = deps.billingEnabled ?? isBillingEnabled();
  const admin = deps.admin ?? createSupabaseServiceClient();
  const resolveProfessionalContext = deps.resolveProfessionalContext ?? defaultResolveProfessionalContext;
  const loadLatestSubscription = deps.loadLatestSubscription ?? defaultLoadLatestSubscription;
  const countRelevantBookings = deps.countRelevantBookings ?? defaultCountRelevantBookings;
  const listPaidInvoices = deps.listPaidInvoices ?? defaultListPaidInvoices;

  const prof = await resolveProfessionalContext(userId, admin);
  if (!prof) return null;

  const model = defaultModel();
  model.businessName = prof.businessName?.trim() || prof.slug || "Salonul tău";

  const subscription = await loadLatestSubscription(prof.id, admin);
  const statusModel = toStatusModel({
    subscription,
    createdAt: prof.createdAt,
    now,
    billingEnabled
  });

  const currentMonth = monthStart(now);
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const nextMonth = nextMonthStart(now);

  const [bookingsCurrentMonth, bookingsPreviousMonth] = await Promise.all([
    countRelevantBookings({
      profesionistId: prof.id,
      fromIso: currentMonth.toISOString(),
      toIso: nextMonth.toISOString(),
      admin
    }),
    countRelevantBookings({
      profesionistId: prof.id,
      fromIso: previousMonth.toISOString(),
      toIso: currentMonth.toISOString(),
      admin
    })
  ]);

  model.status = statusModel.status;
  model.statusLabel = statusModel.statusLabel;
  model.statusMessage = statusModel.statusMessage;
  model.currentPeriodEnd = statusModel.currentPeriodEnd;
  model.cancelAtPeriodEnd = statusModel.cancelAtPeriodEnd;
  model.canOpenCheckout = statusModel.canOpenCheckout;
  model.canOpenPortal = statusModel.canOpenPortal;
  model.canCancelSubscription = statusModel.canCancelSubscription;
  model.bookingsCurrentMonth = bookingsCurrentMonth;
  model.bookingsPreviousMonth = bookingsPreviousMonth;

  const revenueByMonth = new Map<string, number>();
  try {
    const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const invoices = await listPaidInvoices({
      stripeSubscriptionId: subscription?.stripe_subscription_id ?? null,
      stripeCustomerId: subscription?.stripe_customer_id ?? null,
      sinceEpochSeconds: Math.floor(trendStart.getTime() / 1000)
    });

    for (const inv of invoices) {
      const key = `${inv.createdAt.getFullYear()}-${String(inv.createdAt.getMonth() + 1).padStart(2, "0")}`;
      revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + inv.amountPaid);
    }
  } catch {
    model.providerWarning = "Nu am putut încărca veniturile din Stripe acum. Datele locale despre abonament și booking-uri rămân disponibile.";
  }

  const trendLabels: string[] = [];
  const trendValues: number[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    trendLabels.push(monthLabel(d));
    trendValues.push(Number((revenueByMonth.get(key) ?? 0).toFixed(2)));
  }

  model.trendLabels = trendLabels;
  model.trendValues = trendValues;
  model.revenueCurrentMonth = trendValues[trendValues.length - 1] ?? 0;
  model.revenuePreviousMonth = trendValues[trendValues.length - 2] ?? 0;
  model.revenueDeltaPercent = safeDelta(model.revenueCurrentMonth, model.revenuePreviousMonth);

  return model;
}