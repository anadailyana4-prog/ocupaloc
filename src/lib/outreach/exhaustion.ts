import { exhaustionEvaluationInputSchema } from "@/lib/outreach/ops-schemas";
import type { ExhaustionEvaluationInput } from "@/lib/outreach/ops-schemas";
import type { ExhaustionStage } from "@/lib/outreach/ops-constants";

export interface ExhaustionEvaluationResult {
  score: number;
  stage: ExhaustionStage;
  shouldMarkExhausted: boolean;
  probableExhaustion: "scazuta" | "medie" | "mare";
  reasons: string[];
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

export function evaluateZoneExhaustion(input: ExhaustionEvaluationInput): ExhaustionEvaluationResult {
  const parsed = exhaustionEvaluationInputSchema.parse(input);
  const reasons: string[] = [];

  const unusableLeads =
    parsed.uncontactableLeads +
    parsed.duplicateLeads +
    parsed.alreadyContactedLeads +
    parsed.suppressedLeads;
  const remainingPool = parsed.remainingContactableLeads + unusableLeads;
  const unusableShare = remainingPool > 0 ? unusableLeads / remainingPool : 1;

  let score = 0;

  if (parsed.scrapingCompleted) {
    score += 18;
    reasons.push("Scraping-ul complet al zonei a fost marcat ca finalizat.");
  }

  if (parsed.scrapeRunsCount >= 3) {
    score += 10;
    reasons.push(`Au fost rulate ${parsed.scrapeRunsCount} iteratii de scraping.`);
  }

  if (parsed.previousNewValidLeads <= 8 && parsed.latestNewValidLeads <= 3) {
    score += 22;
    reasons.push(
      `Ultimele rerulari au adus putin volum util: ${parsed.previousNewValidLeads} si ${parsed.latestNewValidLeads} lead-uri noi valide.`
    );
  }

  if (parsed.latestNewValidLeads <= 1) {
    score += 12;
    reasons.push("Ultima rerulare aproape nu a mai adus lead-uri noi valide.");
  }

  if (parsed.lowYieldRunsCount >= 2 || parsed.usefulYieldRate <= 0.05) {
    score += 16;
    reasons.push("Randamentul zonei a devenit foarte mic.");
  }

  if (unusableShare >= 0.75) {
    score += 18;
    reasons.push("Majoritatea lead-urilor ramase sunt duplicate, necontactabile sau deja atinse.");
  }

  if (parsed.remainingContactableLeads <= 10) {
    score += 10;
    reasons.push("Au ramas foarte putine lead-uri contactabile.");
  }

  if (parsed.confirmationRunsWithoutUsefulVolume >= 1 && parsed.latestNewValidLeads <= 1) {
    score += 8;
    reasons.push("Exista deja o rerulare de confirmare fara volum util relevant.");
  }

  const finalScore = clampScore(score);

  let stage: ExhaustionStage = "active";
  let probableExhaustion: ExhaustionEvaluationResult["probableExhaustion"] = "scazuta";

  if (finalScore >= 55) {
    stage = "near_exhaustion";
    probableExhaustion = "medie";
  }

  if (
    finalScore >= 72 &&
    parsed.scrapingCompleted &&
    parsed.previousNewValidLeads <= 8 &&
    parsed.latestNewValidLeads <= 3
  ) {
    stage = "exhausted_candidate";
    probableExhaustion = "mare";
  }

  const shouldMarkExhausted =
    finalScore >= 82 &&
    parsed.scrapingCompleted &&
    parsed.scrapeRunsCount >= 3 &&
    parsed.latestNewValidLeads <= 1 &&
    parsed.previousNewValidLeads <= 6 &&
    unusableShare >= 0.75 &&
    parsed.confirmationRunsWithoutUsefulVolume >= 1;

  if (shouldMarkExhausted) {
    stage = "exhausted_final";
    probableExhaustion = "mare";
    reasons.push("Zona indeplineste criteriile pentru statusul exhausted.");
  }

  return {
    score: finalScore,
    stage,
    shouldMarkExhausted,
    probableExhaustion,
    reasons
  };
}