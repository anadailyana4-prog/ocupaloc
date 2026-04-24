/**
 * Maps internal entitlement denial reasons to human-readable Romanian messages.
 * Always use this before surfacing a reason to any end user (salon owner or client).
 */
const REASON_MESSAGES: Record<string, string> = {
  subscription_past_due:
    "Plata abonamentului a eșuat. Actualizează datele de plată pentru a continua.",
  subscription_canceled:
    "Abonamentul a fost anulat. Reactivează-l pentru a primi programări.",
  subscription_unpaid:
    "Abonamentul este suspendat din cauza plăților restante. Actualizează datele de plată.",
  subscription_incomplete_expired:
    "Sesiunea de plată a expirat. Pornește un abonament nou din secțiunea Prețuri.",
  subscription_incomplete:
    "Plata abonamentului este în curs de procesare. Finalizează plata pentru a activa accesul.",
  subscription_paused:
    "Abonamentul este pausat temporar. Reactivează-l din panoul de abonamente.",
  no_active_subscription:
    "Nu există un abonament activ. Abonează-te pentru a permite rezervări online.",
  // These are "allowed" reasons — no message needed, but map them for safety.
  grace_period: "",
  legacy_trial: "",
};

/**
 * Returns a user-facing Romanian message for a given entitlement reason.
 * Falls back to a generic message if the reason is unknown.
 */
export function entitlementMessage(reason: string): string {
  if (reason in REASON_MESSAGES) {
    return REASON_MESSAGES[reason]!;
  }
  return "Accesul la programări este momentan indisponibil. Contactează suportul dacă problema persistă.";
}
