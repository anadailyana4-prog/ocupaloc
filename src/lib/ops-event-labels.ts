import { BILLING_EVENT_TYPES, GROWTH_EVENT_TYPES } from "@/lib/ops-event-taxonomy";

const OP_EVENT_LABELS: Record<string, string> = {
  [BILLING_EVENT_TYPES.TRIAL_GRANTED]: "Trial acordat",
  [BILLING_EVENT_TYPES.TRIAL_DENIED]: "Trial respins",
  [BILLING_EVENT_TYPES.CHECKOUT_STARTED]: "Checkout pornit",
  [BILLING_EVENT_TYPES.REACTIVATION_ATTEMPTED]: "Tentativă reactivare",
  [BILLING_EVENT_TYPES.SUBSCRIPTION_ACTIVATED]: "Abonament activat",
  [BILLING_EVENT_TYPES.SUBSCRIPTION_CANCELED]: "Abonament anulat",
  [BILLING_EVENT_TYPES.WINBACK_OFFER_SENT]: "Winback trimis",
  [BILLING_EVENT_TYPES.RECONCILIATION_MISMATCH]: "Diferență reconciliere billing",
  [BILLING_EVENT_TYPES.RECONCILIATION_STARTED]: "Reconciliere billing pornită",
  [BILLING_EVENT_TYPES.RECONCILIATION_FIXED]: "Reconciliere billing corectată",
  [BILLING_EVENT_TYPES.RECONCILIATION_FAILED]: "Reconciliere billing eșuată",
  [BILLING_EVENT_TYPES.RECONCILIATION_SUMMARY]: "Rezumat reconciliere billing",
  [GROWTH_EVENT_TYPES.ACTIVATION_NUDGE_TRIGGERED]: "Nudge activare trimis",
  [GROWTH_EVENT_TYPES.ACTIVATION_NUDGE_JOB_FINISHED]: "Job nudge activare finalizat"
};

export function formatOperationalEventType(eventType: string | null | undefined): string {
  const value = String(eventType ?? "").trim();
  if (!value) return "Eveniment necunoscut";
  if (OP_EVENT_LABELS[value]) return OP_EVENT_LABELS[value];

  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
