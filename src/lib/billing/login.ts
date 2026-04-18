export const BILLING_LOGIN_PATH = "/login";

export function buildBillingLoginRedirect(siteUrl: string): URL {
  return new URL(BILLING_LOGIN_PATH, siteUrl);
}
