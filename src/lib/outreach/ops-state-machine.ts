import { coverageZoneTransitionSchema } from "@/lib/outreach/ops-schemas";
import type { CoverageZoneTransitionInput } from "@/lib/outreach/ops-schemas";
import type { OutreachZoneStatus } from "@/lib/outreach/ops-constants";

const ALLOWED_ZONE_TRANSITIONS: Record<OutreachZoneStatus, readonly OutreachZoneStatus[]> = {
  planned: ["scraping", "paused"],
  scraping: ["qualifying", "paused"],
  qualifying: ["ready", "paused"],
  ready: ["sending", "paused"],
  sending: ["cooldown", "exhausted", "paused"],
  cooldown: ["sending", "paused"],
  exhausted: [],
  paused: ["ready", "sending"]
};

export function getAllowedZoneTransitions(status: OutreachZoneStatus): readonly OutreachZoneStatus[] {
  return ALLOWED_ZONE_TRANSITIONS[status];
}

export function canTransitionZoneStatus(fromStatus: OutreachZoneStatus, toStatus: OutreachZoneStatus): boolean {
  return ALLOWED_ZONE_TRANSITIONS[fromStatus].includes(toStatus);
}

export function assertZoneTransition(fromStatus: OutreachZoneStatus, toStatus: OutreachZoneStatus): void {
  if (!canTransitionZoneStatus(fromStatus, toStatus)) {
    throw new Error(`Invalid coverage zone transition: ${fromStatus} -> ${toStatus}`);
  }
}

export function buildCoverageZoneTransition(input: CoverageZoneTransitionInput): CoverageZoneTransitionInput {
  const parsed = coverageZoneTransitionSchema.parse(input);
  assertZoneTransition(parsed.fromStatus, parsed.toStatus);
  return parsed;
}

export function getResumeStatus(pausedFromStatus: OutreachZoneStatus | null | undefined): OutreachZoneStatus {
  if (pausedFromStatus === "sending") {
    return "sending";
  }

  return "ready";
}