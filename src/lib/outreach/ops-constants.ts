export const OUTREACH_ZONE_STATUSES = [
  "planned",
  "scraping",
  "qualifying",
  "ready",
  "sending",
  "cooldown",
  "exhausted",
  "paused"
] as const;

export const EXHAUSTION_STAGES = [
  "active",
  "near_exhaustion",
  "exhausted_candidate",
  "exhausted_final"
] as const;

export const TELEGRAM_ADMIN_ROLES = ["owner", "admin", "operator"] as const;

export const OUTREACH_COMMANDS = [
  { command: "start", description: "Porneste interactiunea cu botul" },
  { command: "status", description: "Arata statusul operational curent" },
  { command: "queue", description: "Arata coada de lucru (lead-uri + follow-up due)" },
  { command: "scrape", description: "Porneste scraping + calificare pentru zona activa" },
  { command: "send", description: "Porneste trimiterea imediat (optional: /send N)" },
  { command: "approve_next", description: "Confirma trecerea la urmatoarea zona sau nisa" },
  { command: "report", description: "Trimite raportul zilei" },
  { command: "help", description: "Ajutor si lista comenzilor" }
] as const;

export const DEFAULT_OUTREACH_LIMITS = {
  perHour: 10,
  perDay: 240,
  followUpDelayDays: 4,
  maxBatchSize: 10,
  followUpStep2DelayDays: 7,
  followUpStep3DelayDays: 9,
  followUpJitterDays: 1,
  maxDailyBreakupMessages: 6,
  breakUpMinCommercialScore: 75
} as const;

export const DEFAULT_OUTREACH_HEALTH_THRESHOLDS = {
  minQualifiedLeadsToSend: 5,
  minContactableLeadsToSend: 3,
  lowYieldMinInsertedLeads: 5,
  bounceAlertRate: 0.05,
  bounceCriticalRate: 0.1
} as const;

export type OutreachZoneStatus = (typeof OUTREACH_ZONE_STATUSES)[number];
export type ExhaustionStage = (typeof EXHAUSTION_STAGES)[number];
export type TelegramAdminRole = (typeof TELEGRAM_ADMIN_ROLES)[number];