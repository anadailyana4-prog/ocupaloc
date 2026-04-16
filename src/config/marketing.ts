/** Single source of truth for pricing & trial — keep landing, /preturi și mesaje în sync. */
export const BRAND_NAME = "Ocupaloc";
export const TRIAL_DAYS = 7;
export const MONTHLY_PRICE_LEI = 99.99;
/** Afișare în UI (virgulă românească). */
export const MONTHLY_PRICE_LABEL = "99,99";
export const SUPPORT_EMAIL = "contact@ocupaloc.ro";

/**
 * Link suport: WhatsApp dacă există `NEXT_PUBLIC_SUPPORT_WHATSAPP` (doar cifre, ex. 40747000123),
 * altfel mailto.
 */
export function getSupportContactHref(): string {
  const raw = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP : undefined;
  if (raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length >= 10) return `https://wa.me/${digits}`;
  }
  return `mailto:${SUPPORT_EMAIL}`;
}

export function getSupportContactLabel(): string {
  const raw = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP : undefined;
  return raw && raw.replace(/\D/g, "").length >= 10 ? "WhatsApp" : "Contact";
}
