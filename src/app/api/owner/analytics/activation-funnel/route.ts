import { NextResponse } from "next/server";

import { BILLING_EVENT_TYPES } from "@/lib/ops-event-taxonomy";
import { hasOnboardingCompleted } from "@/lib/professional-milestones";
import { ACTIVATION_FUNNEL_MILESTONES, weekStartKey } from "@/lib/owner/activation-funnel";
import { logOwnerAction, requireOwnerAdminFromRequest } from "@/lib/owner/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type OperationalEventRow = {
  entity_id: string | null;
  event_type: string;
  outcome: string;
  created_at: string;
};

type ProfRow = {
  id: string;
  created_at: string;
  onboarding_completed_at: string | null;
  onboarding_pas: number | null;
};

export async function GET(request: Request) {
  try {
    const auth = await requireOwnerAdminFromRequest(request);
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);

    const windowDaysRaw = Number(searchParams.get("windowDays") ?? "90");
    const windowDays = Number.isFinite(windowDaysRaw)
      ? Math.min(365, Math.max(7, Math.floor(windowDaysRaw)))
      : 90;

    const sinceIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    const [profRes, eventsRes, bookingsRes] = await Promise.all([
      supabase
        .from("profesionisti")
        .select("id, created_at, onboarding_completed_at, onboarding_pas")
        .gte("created_at", sinceIso),
      supabase
        .from("operational_events")
        .select("entity_id, event_type, outcome, created_at")
        .eq("flow", "billing")
        .in("event_type", [
          BILLING_EVENT_TYPES.TRIAL_GRANTED,
          BILLING_EVENT_TYPES.CHECKOUT_STARTED,
          BILLING_EVENT_TYPES.SUBSCRIPTION_ACTIVATED
        ])
        .gte("created_at", sinceIso),
      supabase
        .from("programari")
        .select("profesionist_id, status, created_at")
        .eq("status", "confirmat")
        .gte("created_at", sinceIso)
    ]);

    if (profRes.error) {
      return NextResponse.json({ ok: false, error: profRes.error.message }, { status: 500 });
    }
    if (eventsRes.error) {
      return NextResponse.json({ ok: false, error: eventsRes.error.message }, { status: 500 });
    }
    if (bookingsRes.error) {
      return NextResponse.json({ ok: false, error: bookingsRes.error.message }, { status: 500 });
    }

    const profs = (profRes.data ?? []) as ProfRow[];
    const events = (eventsRes.data ?? []) as OperationalEventRow[];

    const profSet = new Set(profs.map((row) => row.id));

    const trialGrantedSet = new Set<string>();
    const checkoutStartedSet = new Set<string>();
    const subscriptionActivatedSet = new Set<string>();
    for (const row of events) {
      const entityId = row.entity_id?.trim();
      if (!entityId || !profSet.has(entityId) || row.outcome !== "success") continue;

      if (row.event_type === BILLING_EVENT_TYPES.TRIAL_GRANTED) trialGrantedSet.add(entityId);
      if (row.event_type === BILLING_EVENT_TYPES.CHECKOUT_STARTED) checkoutStartedSet.add(entityId);
      if (row.event_type === BILLING_EVENT_TYPES.SUBSCRIPTION_ACTIVATED) subscriptionActivatedSet.add(entityId);
    }

    const firstBookingSet = new Set<string>();
    for (const row of bookingsRes.data ?? []) {
      const profId = String(row.profesionist_id ?? "").trim();
      if (!profId || !profSet.has(profId)) continue;
      firstBookingSet.add(profId);
    }

    const onboardingCompletedSet = new Set(
      profs.filter((row) => hasOnboardingCompleted(row)).map((row) => row.id)
    );

    const funnel = {
      windowDays,
      milestones: [
        {
          key: ACTIVATION_FUNNEL_MILESTONES.ACCOUNT_CREATED.key,
          label: ACTIVATION_FUNNEL_MILESTONES.ACCOUNT_CREATED.label,
          count: profs.length
        },
        {
          key: ACTIVATION_FUNNEL_MILESTONES.ONBOARDING_COMPLETED.key,
          label: ACTIVATION_FUNNEL_MILESTONES.ONBOARDING_COMPLETED.label,
          count: onboardingCompletedSet.size
        },
        {
          key: ACTIVATION_FUNNEL_MILESTONES.TRIAL_GRANTED.key,
          label: ACTIVATION_FUNNEL_MILESTONES.TRIAL_GRANTED.label,
          count: trialGrantedSet.size
        },
        {
          key: ACTIVATION_FUNNEL_MILESTONES.CHECKOUT_STARTED.key,
          label: ACTIVATION_FUNNEL_MILESTONES.CHECKOUT_STARTED.label,
          count: checkoutStartedSet.size
        },
        {
          key: ACTIVATION_FUNNEL_MILESTONES.SUBSCRIPTION_ACTIVATED.key,
          label: ACTIVATION_FUNNEL_MILESTONES.SUBSCRIPTION_ACTIVATED.label,
          count: subscriptionActivatedSet.size
        },
        {
          key: ACTIVATION_FUNNEL_MILESTONES.FIRST_BOOKING_CONFIRMED.key,
          label: ACTIVATION_FUNNEL_MILESTONES.FIRST_BOOKING_CONFIRMED.label,
          count: firstBookingSet.size
        }
      ]
    };

    const cohortMap = new Map<string, { cohortWeek: string; trials: number; paid: number }>();
    const activationByProf = new Map<string, string>();
    for (const row of events) {
      const entityId = row.entity_id?.trim();
      if (!entityId || row.outcome !== "success") continue;
      if (row.event_type !== BILLING_EVENT_TYPES.SUBSCRIPTION_ACTIVATED) continue;
      const existing = activationByProf.get(entityId);
      if (!existing || new Date(row.created_at).getTime() < new Date(existing).getTime()) {
        activationByProf.set(entityId, row.created_at);
      }
    }

    for (const row of events) {
      const entityId = row.entity_id?.trim();
      if (!entityId || row.outcome !== "success") continue;
      if (row.event_type !== BILLING_EVENT_TYPES.TRIAL_GRANTED) continue;

      const cohortWeek = weekStartKey(row.created_at);
      const cohort = cohortMap.get(cohortWeek) ?? { cohortWeek, trials: 0, paid: 0 };
      cohort.trials += 1;

      if (activationByProf.has(entityId)) {
        cohort.paid += 1;
      }

      cohortMap.set(cohortWeek, cohort);
    }

    const trialToPaidCohorts = Array.from(cohortMap.values())
      .sort((a, b) => (a.cohortWeek < b.cohortWeek ? -1 : 1))
      .map((row) => ({
        ...row,
        conversionRatePct: row.trials > 0 ? Number(((row.paid / row.trials) * 100).toFixed(2)) : 0
      }));

    await logOwnerAction(
      "owner_activation_funnel_read",
      "analytics",
      undefined,
      {
        windowDays,
        cohorts: trialToPaidCohorts.length
      },
      {
        ipAddress: auth.ipAddress,
        userAgent: auth.userAgent
      }
    );

    return NextResponse.json({
      ok: true,
      data: {
        generatedAt: new Date().toISOString(),
        funnel,
        trialToPaidCohorts
      }
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
}
