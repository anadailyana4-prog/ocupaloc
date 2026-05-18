export const ACTIVATION_FUNNEL_MILESTONES = {
  ACCOUNT_CREATED: { key: "account_created", label: "Cont creat" },
  ONBOARDING_COMPLETED: { key: "onboarding_completed", label: "Onboarding complet" },
  TRIAL_GRANTED: { key: "trial_granted", label: "Trial acordat" },
  CHECKOUT_STARTED: { key: "checkout_started", label: "Checkout pornit" },
  SUBSCRIPTION_ACTIVATED: { key: "subscription_activated", label: "Abonament activat" },
  FIRST_BOOKING_CONFIRMED: { key: "first_booking_confirmed", label: "Primul booking confirmat" }
} as const;

export type ActivationMilestoneKey =
  typeof ACTIVATION_FUNNEL_MILESTONES[keyof typeof ACTIVATION_FUNNEL_MILESTONES]["key"];

export function weekStartKey(iso: string): string {
  const date = new Date(iso);
  const day = date.getUTCDay();
  const delta = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + delta);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}
