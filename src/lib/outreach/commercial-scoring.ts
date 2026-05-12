/**
 * Commercial scoring for leads beyond hot/warm/cold.
 * Categories help prioritize outreach effort in the Romanian local market.
 */

export type CommercialCategory =
  | "easy_close"     // ușor de închis — mic, owner direct, potrivire clara
  | "premium_setup"  // merită setup premium — staff mare, site existent, plateste mai mult
  | "testimonial"    // bun pentru testimonial — nisa responsiva, review score mare
  | "reseller";      // bun pentru reseller — locatii multiple, potential franciza

export interface CommercialScore {
  category: CommercialCategory;
  score: number; // 0-100
  reasons: string[];
}

interface LeadSignals {
  hasEmail: boolean;
  hasPhone: boolean;
  hasWebsite: boolean;
  reviewCount: number | null;
  reviewScore: number | null;
  category: string | null;
  businessName: string | null;
  locality: string | null;
  observableSignals: Record<string, unknown> | null;
}

const TESTIMONIAL_NICHES = [
  "psihologi", "psihoterapeuți", "psihoterapie", "psychologist",
  "nutritioniști", "nutritionisti", "nutritionist", "dieteticieni",
  "fizioterapie", "fizioterapeuți", "kinetoterapie", "kinetoterapeuti",
  "dentisti", "stomatologi", "stomatologie", "dentist",
  "masaj", "spa", "wellness", "cosmetica", "cosmetician"
];

const RESELLER_KEYWORDS = [
  "grup", "group", "holding", "network", "net", "retea", "rețea",
  "chain", "lant", "lanț", "franchise", "franciza", "franciză",
  "national", "național", "nationwide", "romania", "românia"
];

function containsKeyword(text: string | null | undefined, keywords: string[]): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function isTestimonialNiche(category: string | null): boolean {
  return containsKeyword(category, TESTIMONIAL_NICHES);
}

function hasResellerSignals(businessName: string | null, signals: Record<string, unknown> | null): boolean {
  if (containsKeyword(businessName, RESELLER_KEYWORDS)) return true;
  if (signals && typeof signals === "object") {
    const locationsCount = signals["locations_count"] ?? signals["locatii_count"];
    if (typeof locationsCount === "number" && locationsCount > 1) return true;
  }
  return false;
}

export function computeCommercialScore(signals: LeadSignals): CommercialScore {
  const scores: Record<CommercialCategory, number> = {
    easy_close: 0,
    premium_setup: 0,
    testimonial: 0,
    reseller: 0
  };
  const reasons: Record<CommercialCategory, string[]> = {
    easy_close: [],
    premium_setup: [],
    testimonial: [],
    reseller: []
  };

  // --- easy_close: contact direct, nevoi simple, mai usor de convins
  if (signals.hasPhone) {
    scores.easy_close += 30;
    reasons.easy_close.push("are numar de telefon direct");
  }
  if (signals.hasEmail) {
    scores.easy_close += 25;
    reasons.easy_close.push("are email de contact");
  }
  if (!signals.hasWebsite) {
    scores.easy_close += 20;
    reasons.easy_close.push("nu are site — nevoie clara de prezenta online");
  }
  if ((signals.reviewCount ?? 0) < 50) {
    scores.easy_close += 15;
    reasons.easy_close.push("putine recenzii — business mic, decizie rapida");
  }
  if (signals.hasPhone && signals.hasEmail) {
    scores.easy_close += 10;
    reasons.easy_close.push("date de contact complete");
  }

  // --- premium_setup: business mai mare, merita investitie mai mare
  if (signals.hasWebsite) {
    scores.premium_setup += 30;
    reasons.premium_setup.push("are deja un site — inteles tehnic de baza");
  }
  if ((signals.reviewCount ?? 0) > 100) {
    scores.premium_setup += 30;
    reasons.premium_setup.push("peste 100 recenzii — business cu trafic real");
  } else if ((signals.reviewCount ?? 0) > 50) {
    scores.premium_setup += 15;
    reasons.premium_setup.push("peste 50 recenzii — business activ");
  }
  if ((signals.reviewScore ?? 0) >= 4.5) {
    scores.premium_setup += 20;
    reasons.premium_setup.push("rating excelent — brand de calitate");
  }
  if (signals.observableSignals && typeof signals.observableSignals === "object") {
    const obs = signals.observableSignals;
    if (obs["has_booking_system"] || obs["has_online_booking"]) {
      // Already has a booking system — less need for OcupaLoc; penalize all categories
      scores.easy_close   = Math.max(0, scores.easy_close   - 40);
      scores.premium_setup = Math.max(0, scores.premium_setup - 40);
      scores.testimonial  = Math.max(0, scores.testimonial  - 40);
      scores.reseller     = Math.max(0, scores.reseller     - 40);
      reasons.easy_close.push("are deja sistem de programari — interes redus");
      reasons.premium_setup.push("are deja sistem de programari — interes redus");
      reasons.testimonial.push("are deja sistem de programari — interes redus");
      reasons.reseller.push("are deja sistem de programari — interes redus");
    } else {
      // No booking system — prime OcupaLoc prospect
      scores.easy_close += 20;
      reasons.easy_close.push("nu are sistem de programari — nevoia noastra principala");
    }
  } else {
    // Signal absent — assume no booking system (positive for easy_close)
    scores.easy_close += 10;
    reasons.easy_close.push("nicio dovada de sistem de programari");
  }

  // --- testimonial: nisa responsiva, review bun, rezultate vizibile
  if (isTestimonialNiche(signals.category)) {
    scores.testimonial += 40;
    reasons.testimonial.push("nisa cu clienti responsivi la recenzii");
  }
  if ((signals.reviewScore ?? 0) >= 4.7) {
    scores.testimonial += 30;
    reasons.testimonial.push("rating exceptional (>=4.7) — clienti multumiti");
  } else if ((signals.reviewScore ?? 0) >= 4.5) {
    scores.testimonial += 15;
    reasons.testimonial.push("rating bun (>=4.5)");
  }
  if (signals.hasEmail) {
    scores.testimonial += 15;
    reasons.testimonial.push("contact email disponibil pentru follow-up");
  }
  if ((signals.reviewCount ?? 0) >= 20) {
    scores.testimonial += 15;
    reasons.testimonial.push("baza de clienti stabila pentru testimonial");
  }

  // --- reseller: locatii multiple, potential de extindere nationala
  if (hasResellerSignals(signals.businessName, signals.observableSignals)) {
    scores.reseller += 50;
    reasons.reseller.push("semnale de tip retea sau locatii multiple");
  }
  if ((signals.reviewCount ?? 0) > 200) {
    scores.reseller += 20;
    reasons.reseller.push("volum mare de recenzii — prezenta la scara");
  }
  if (signals.hasWebsite && signals.hasEmail) {
    scores.reseller += 20;
    reasons.reseller.push("prezenta digitala completa — sofisticate operational");
  }
  if (signals.observableSignals && typeof signals.observableSignals === "object") {
    const obs = signals.observableSignals;
    if (obs["has_staff_list"] || obs["multi_location"]) {
      scores.reseller += 10;
      reasons.reseller.push("semnale multi-staff sau multi-locatie");
    }
  }

  // Pick best category
  const best = (Object.keys(scores) as CommercialCategory[]).reduce(
    (top, cat) => (scores[cat] > scores[top] ? cat : top),
    "easy_close" as CommercialCategory
  );

  return {
    category: best,
    score: Math.min(100, scores[best]),
    reasons: reasons[best]
  };
}

export function commercialCategoryLabel(category: CommercialCategory): string {
  switch (category) {
    case "easy_close":
      return "🟢 Ușor de închis";
    case "premium_setup":
      return "💎 Merită setup premium";
    case "testimonial":
      return "⭐ Bun pentru testimonial";
    case "reseller":
      return "🔗 Potențial reseller";
  }
}
