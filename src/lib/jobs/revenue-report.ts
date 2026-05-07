import type { SupabaseClient } from "@supabase/supabase-js";

import { getStripeClient } from "@/lib/billing/stripe";
import { renderRevenueDigestEmail, type RevenueDigestSalon } from "@/lib/email/revenue-digest";
import { sendResendEmail } from "@/lib/email/resend";
import { logError } from "@/lib/logger";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type InvoiceLite = {
  subscription: string | null;
  amountPaid: number;
  createdAt: Date;
};

type SubscriptionLite = {
  id: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  metadata: Record<string, string>;
};

type RevenueReportDeps = {
  now?: Date;
  recipients?: string[];
  admin?: SupabaseClient;
  listInvoices?: (gteEpochSeconds: number) => Promise<InvoiceLite[]>;
  listSubscriptions?: () => Promise<SubscriptionLite[]>;
  sendEmail?: (input: { to: string[]; subject: string; text: string; html: string }) => Promise<void>;
};

export type RevenueReportResult = {
  sent: boolean;
  recipients: number;
  totalCurrentWeek: number;
  totalPreviousWeek: number;
  growthPercent: number;
  topPerformers: RevenueDigestSalon[];
  churnRiskSalons: RevenueDigestSalon[];
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function fmtWeekLabel(from: Date, to: Date): string {
  const a = from.toLocaleDateString("ro-RO");
  const b = to.toLocaleDateString("ro-RO");
  return `${a} - ${b}`;
}

function safeGrowth(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function aggregateRevenueMetrics(input: {
  invoices: InvoiceLite[];
  subscriptions: SubscriptionLite[];
  salonNames: Map<string, string>;
  now: Date;
}): Omit<RevenueReportResult, "sent" | "recipients"> & { weekLabel: string } {
  const now = input.now;
  const day0 = startOfDay(now);
  const currentStart = new Date(day0.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previousStart = new Date(day0.getTime() - 14 * 24 * 60 * 60 * 1000);

  const subSalonMap = new Map<string, string>();
  for (const sub of input.subscriptions) {
    const salonId = sub.metadata.profesionist_id;
    if (salonId) subSalonMap.set(sub.id, salonId);
  }

  const currentBySalon = new Map<string, number>();
  const previousBySalon = new Map<string, number>();
  let totalCurrentWeek = 0;
  let totalPreviousWeek = 0;

  for (const inv of input.invoices) {
    const salonId = inv.subscription ? subSalonMap.get(inv.subscription) : undefined;
    if (!salonId) continue;

    if (inv.createdAt >= currentStart) {
      totalCurrentWeek += inv.amountPaid;
      currentBySalon.set(salonId, (currentBySalon.get(salonId) ?? 0) + inv.amountPaid);
    } else if (inv.createdAt >= previousStart) {
      totalPreviousWeek += inv.amountPaid;
      previousBySalon.set(salonId, (previousBySalon.get(salonId) ?? 0) + inv.amountPaid);
    }
  }

  const salonIds = new Set<string>([...currentBySalon.keys(), ...previousBySalon.keys()]);
  const rows: RevenueDigestSalon[] = Array.from(salonIds).map((salonId) => {
    const current = currentBySalon.get(salonId) ?? 0;
    const previous = previousBySalon.get(salonId) ?? 0;
    return {
      salonId,
      salonName: input.salonNames.get(salonId) ?? salonId,
      revenueCurrentWeek: Number(current.toFixed(2)),
      revenuePreviousWeek: Number(previous.toFixed(2)),
      growthPercent: Number(safeGrowth(current, previous).toFixed(2))
    };
  });

  const topPerformers = rows
    .slice()
    .sort((a, b) => b.revenueCurrentWeek - a.revenueCurrentWeek)
    .slice(0, 10);

  const churnRiskSalonIds = new Set(
    input.subscriptions
      .filter((sub) => sub.status === "past_due" || sub.status === "canceled" || sub.cancelAtPeriodEnd)
      .map((sub) => sub.metadata.profesionist_id)
      .filter(Boolean)
  );

  const churnRiskSalons = rows
    .filter((row) => churnRiskSalonIds.has(row.salonId))
    .sort((a, b) => b.revenueCurrentWeek - a.revenueCurrentWeek)
    .slice(0, 10);

  return {
    weekLabel: fmtWeekLabel(currentStart, now),
    totalCurrentWeek: Number(totalCurrentWeek.toFixed(2)),
    totalPreviousWeek: Number(totalPreviousWeek.toFixed(2)),
    growthPercent: Number(safeGrowth(totalCurrentWeek, totalPreviousWeek).toFixed(2)),
    topPerformers,
    churnRiskSalons
  };
}

async function defaultListSubscriptions(): Promise<SubscriptionLite[]> {
  const stripe = getStripeClient();
  const subscriptions: SubscriptionLite[] = [];

  for await (const sub of stripe.subscriptions.list({ status: "all", limit: 100 })) {
    subscriptions.push({
      id: sub.id,
      status: sub.status,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      metadata: sub.metadata
    });
    if (subscriptions.length >= 1200) break;
  }

  return subscriptions;
}

async function defaultListInvoices(gteEpochSeconds: number): Promise<InvoiceLite[]> {
  const stripe = getStripeClient();
  const invoices: InvoiceLite[] = [];

  for await (const inv of stripe.invoices.list({ status: "paid", limit: 100, created: { gte: gteEpochSeconds } })) {
    const invRecord = inv as unknown as {
      subscription?: string | { id?: string | null } | null;
      parent?: { subscription_details?: { subscription?: string | null } | null } | null;
    };
    invoices.push({
      subscription:
        typeof invRecord.subscription === "string"
          ? invRecord.subscription
          : invRecord.subscription?.id ?? invRecord.parent?.subscription_details?.subscription ?? null,
      amountPaid: (inv.amount_paid ?? 0) / 100,
      createdAt: new Date(inv.created * 1000)
    });
    if (invoices.length >= 5000) break;
  }

  return invoices;
}

function getRecipientsFromEnv(): string[] {
  const set = new Set<string>();
  const admin = process.env.ADMIN_EMAIL?.trim();
  if (admin) set.add(admin);

  const extra = process.env.REVENUE_REPORT_RECIPIENTS?.split(",") ?? [];
  for (const raw of extra) {
    const email = raw.trim();
    if (email) set.add(email);
  }
  return Array.from(set);
}

async function defaultSendEmail(input: { to: string[]; subject: string; text: string; html: string }) {
  await sendResendEmail({
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    event: "weekly_revenue_digest_failed",
    context: { recipients: input.to.length }
  });
}

export async function runWeeklyRevenueReport(requestId?: string, deps: RevenueReportDeps = {}): Promise<RevenueReportResult> {
  const now = deps.now ?? new Date();
  const recipients = deps.recipients ?? getRecipientsFromEnv();

  if (recipients.length === 0) {
    return {
      sent: false,
      recipients: 0,
      totalCurrentWeek: 0,
      totalPreviousWeek: 0,
      growthPercent: 0,
      topPerformers: [],
      churnRiskSalons: []
    };
  }

  const admin = deps.admin ?? createSupabaseServiceClient();
  const listSubscriptions = deps.listSubscriptions ?? defaultListSubscriptions;
  const listInvoices = deps.listInvoices ?? defaultListInvoices;
  const sendEmail = deps.sendEmail ?? defaultSendEmail;

  try {
    const previousStart = new Date(startOfDay(now).getTime() - 14 * 24 * 60 * 60 * 1000);
    const [subscriptions, invoices] = await Promise.all([
      listSubscriptions(),
      listInvoices(Math.floor(previousStart.getTime() / 1000))
    ]);

    const salonIds = Array.from(
      new Set(subscriptions.map((s) => s.metadata.profesionist_id).filter(Boolean))
    );

    const salonNames = new Map<string, string>();
    if (salonIds.length > 0) {
      const { data } = await admin.from("profesionisti").select("id, slug, nume_business").in("id", salonIds);
      for (const row of data ?? []) {
        salonNames.set(row.id, row.nume_business?.trim() || row.slug || row.id);
      }
    }

    const aggregated = aggregateRevenueMetrics({
      invoices,
      subscriptions,
      salonNames,
      now
    });

    const email = renderRevenueDigestEmail({
      weekLabel: aggregated.weekLabel,
      totalCurrentWeek: aggregated.totalCurrentWeek,
      totalPreviousWeek: aggregated.totalPreviousWeek,
      growthPercent: aggregated.growthPercent,
      topPerformers: aggregated.topPerformers,
      churnRiskSalons: aggregated.churnRiskSalons
    });

    await sendEmail({
      to: recipients,
      subject: email.subject,
      text: email.text,
      html: email.html
    });

    return {
      sent: true,
      recipients: recipients.length,
      totalCurrentWeek: aggregated.totalCurrentWeek,
      totalPreviousWeek: aggregated.totalPreviousWeek,
      growthPercent: aggregated.growthPercent,
      topPerformers: aggregated.topPerformers,
      churnRiskSalons: aggregated.churnRiskSalons
    };
  } catch (error) {
    logError("[revenue-report] weekly digest failed", error, { requestId });
    throw error;
  }
}