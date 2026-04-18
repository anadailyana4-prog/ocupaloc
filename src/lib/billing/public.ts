export const BILLING_PRICE_RON = 59.99;
export const BILLING_TRIAL_DAYS = 14;

export function formatBillingPriceRon(): string {
  return BILLING_PRICE_RON.toFixed(2).replace(".", ",");
}

export function getBillingPriceRonLabel(): string {
  return `${formatBillingPriceRon()} RON`;
}

export function getBillingPriceSchemaValue(): string {
  return BILLING_PRICE_RON.toFixed(2);
}

export function getBillingPlanLabel(): string {
  return `${getBillingPriceRonLabel()}/luna`;
}

export function getBillingTrialLabel(): string {
  return `${BILLING_TRIAL_DAYS} zile gratis`;
}