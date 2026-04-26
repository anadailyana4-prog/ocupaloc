const MESSAGES: Record<string, string> = {
  subscription_past_due:
    "Abonamentul tău are o plată restantă. Te rugăm să îl actualizezi pentru a continua să primești programări.",
  subscription_incomplete:
    "Abonamentul tău nu a fost finalizat. Accesează panoul de billing pentru a finaliza plata.",
  subscription_paused:
    "Abonamentul tău este în pauză. Reactivează-l pentru a primi programări.",
  subscription_canceled:
    "Abonamentul tău a fost anulat. Abonează-te din nou pentru a reactiva serviciul.",
  no_active_subscription:
    "Nu ai un abonament activ. Abonează-te pentru a continua să primești programări.",
  billing_error:
    "A apărut o eroare la verificarea abonamentului. Te rugăm să încerci din nou sau să contactezi suportul.",
};

export function entitlementMessage(reason: string): string {
  if (!reason || reason === "grace_period" || reason === "legacy_trial") return "";
  return MESSAGES[reason] ?? "Abonamentul tău nu permite momentan programări noi.";
}
