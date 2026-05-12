import { z } from "zod";

import { EXHAUSTION_STAGES, OUTREACH_ZONE_STATUSES, TELEGRAM_ADMIN_ROLES } from "@/lib/outreach/ops-constants";

export const telegramRoleSchema = z.enum(TELEGRAM_ADMIN_ROLES);
export const outreachZoneStatusSchema = z.enum(OUTREACH_ZONE_STATUSES);
export const exhaustionStageSchema = z.enum(EXHAUSTION_STAGES);

export const coverageZoneTransitionSchema = z.object({
  zoneId: z.string().uuid(),
  fromStatus: outreachZoneStatusSchema,
  toStatus: outreachZoneStatusSchema,
  reason: z.string().trim().min(3).max(500),
  changedByType: z.enum(["system", "telegram", "operator", "cron"]).default("system"),
  changedById: z.string().uuid().optional(),
  context: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({})
});

export const exhaustionEvaluationInputSchema = z.object({
  scrapingCompleted: z.boolean(),
  scrapeRunsCount: z.number().int().min(0),
  latestNewValidLeads: z.number().int().min(0),
  previousNewValidLeads: z.number().int().min(0).default(0),
  rerunHistory: z.array(z.number().int().min(0)).default([]),
  remainingContactableLeads: z.number().int().min(0),
  uncontactableLeads: z.number().int().min(0),
  duplicateLeads: z.number().int().min(0),
  alreadyContactedLeads: z.number().int().min(0),
  suppressedLeads: z.number().int().min(0).default(0),
  lowYieldRunsCount: z.number().int().min(0).default(0),
  usefulYieldRate: z.number().min(0).max(1).default(0),
  confirmationRunsWithoutUsefulVolume: z.number().int().min(0).default(0)
});

export const personalizationInputSchema = z.object({
  nicheSlug: z.string().trim().min(1),
  businessName: z.string().trim().min(1),
  city: z.string().trim().min(1),
  website: z.string().trim().optional(),
  observableSignals: z.object({
    bookingLinkDetected: z.boolean().optional(),
    instagramDetected: z.boolean().optional(),
    hasServiceMenu: z.boolean().optional(),
    reviewsMentionQueue: z.boolean().optional()
  }).default({})
});

export type CoverageZoneTransitionInput = z.infer<typeof coverageZoneTransitionSchema>;
export type ExhaustionEvaluationInput = z.infer<typeof exhaustionEvaluationInputSchema>;
export type PersonalizationInput = z.infer<typeof personalizationInputSchema>;