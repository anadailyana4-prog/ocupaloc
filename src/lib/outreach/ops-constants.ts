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
  { command: "scrape", description: "Porneste scraping + calificare pentru zona activa" },
  { command: "send", description: "Porneste trimiterea imediat pentru zona activa" },
  { command: "delivery", description: "Arata livrate vs nelivrate in campania activa" },
  { command: "coverage", description: "Arata progresul national pe nisa activa" },
  { command: "next", description: "Arata urmatoarea zona planificata" },
  { command: "exhaustion", description: "Explica daca zona este aproape epuizata" },
  { command: "pause", description: "Opreste temporar trimiterea" },
  { command: "resume", description: "Reia trimiterea" },
  { command: "approve_next", description: "Confirma trecerea la urmatoarea zona sau nisa" },
  { command: "replies", description: "Arata reply-urile noi si drafturile sugerate" },
  { command: "report", description: "Trimite raportul zilei" },
  { command: "deliverability", description: "Status SPF/DKIM/DMARC si bounce rate" },
  { command: "help", description: "Ajutor si lista comenzilor" }
] as const;

export const DEFAULT_OUTREACH_LIMITS = {
  perHour: 10,
  perDay: 50,
  followUpDelayDays: 4,
  maxBatchSize: 10,
  followUpStep2DelayDays: 7,
  followUpStep3DelayDays: 9,
  followUpJitterDays: 1,
  maxDailyBreakupMessages: 6,
  breakUpMinCommercialScore: 75
} as const;

export type OutreachZoneStatus = (typeof OUTREACH_ZONE_STATUSES)[number];
export type ExhaustionStage = (typeof EXHAUSTION_STAGES)[number];
export type TelegramAdminRole = (typeof TELEGRAM_ADMIN_ROLES)[number];