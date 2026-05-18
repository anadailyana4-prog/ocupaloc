export const BILLING_EVENT_TYPES = {
  TRIAL_GRANTED: "billing_trial_granted",
  TRIAL_DENIED: "billing_trial_denied",
  CHECKOUT_STARTED: "billing_checkout_started",
  REACTIVATION_ATTEMPTED: "billing_reactivation_attempted",
  SUBSCRIPTION_ACTIVATED: "billing_subscription_activated",
  SUBSCRIPTION_CANCELED: "billing_subscription_canceled",
  WINBACK_OFFER_SENT: "billing_winback_offer_sent",
  RECONCILIATION_MISMATCH: "billing_reconciliation_mismatch",
  RECONCILIATION_STARTED: "billing_reconciliation_started",
  RECONCILIATION_FIXED: "billing_reconciliation_fixed",
  RECONCILIATION_FAILED: "billing_reconciliation_failed",
  RECONCILIATION_SUMMARY: "billing_reconciliation_summary"
} as const;

export const BILLING_RECONCILIATION_SIGNAL_TYPES = [
  BILLING_EVENT_TYPES.RECONCILIATION_MISMATCH
] as const;

export const GROWTH_EVENT_TYPES = {
  ACTIVATION_NUDGE_TRIGGERED: "activation_nudge_triggered",
  ACTIVATION_NUDGE_JOB_FINISHED: "activation_nudge_job_finished"
} as const;

export type BillingEventType = typeof BILLING_EVENT_TYPES[keyof typeof BILLING_EVENT_TYPES];
export type GrowthEventType = typeof GROWTH_EVENT_TYPES[keyof typeof GROWTH_EVENT_TYPES];
