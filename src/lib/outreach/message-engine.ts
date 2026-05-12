/**
 * Message recommendation engine for outreach.
 * Selects optimal message templates based on niche, city, and win_score metrics.
 */

export type NicheType = "barber" | "frizerii" | "saloane" | "clinici_estetice" | "stomatologie" | "fizioterapie" | "masaj_spa" | "psihologi" | "nutritionisti";

export interface MessageTemplate {
  id: string;
  nicheId: NicheType;
  variant: "professional" | "personal" | "direct";
  subject: string;
  body: string;
  cta: string;
  description: string;
}

export interface LeadProfile {
  businessName: string;
  hasWebsite: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  category?: string;
  reviewCount?: number;
  reviewScore?: number;
  previousContact?: { responseType: "positive" | "negative" | "no_response"; daysAgo: number };
}

export interface MessageWinMetrics {
  messageVariant: string;
  nicheId: NicheType;
  city: string;
  replyCount: number;
  positiveReplyCount: number;
  bookingIntentCount: number;
  totalSent: number;
  replyRate: number;
  positiveRate: number;
  bookingRate: number;
}

export interface MessageRecommendation {
  template: MessageTemplate;
  winScore: number; // 0-100
  reasoning: string;
}

/**
 * Message templates by niche.
 * Minimal templates - user can override or add more variants later.
 */
const MESSAGE_TEMPLATES: Record<NicheType, MessageTemplate[]> = {
  barber: [
    {
      id: "barber_pro_1",
      nicheId: "barber",
      variant: "professional",
      subject: "Sistem de programări online pentru bărbia ta",
      body: `Salut,

Am observat că [BUSINESS_NAME] are o bază solidă de clienți.

Cea mai mare pierdere de oportunități pentru barberilor: clienții sună, dar nu pot fi luați mereu imediat.

La ocupaloc.ro oferim:
- Widget simplu pe site
- SMS/Email confirmări automate
- Orice client poate vedea disponibilitatea ta ACUM
- Reduceri mici de timp, mai mulți clienți

Testăm 14 zile, fără bani de încercare.

Interesa?

[SENDER_NAME]
ocupaloc.ro`,
      cta: "Testăm 14 zile",
      description: "Professional pitch, focus on time savings and client volume"
    },
    {
      id: "barber_personal_1",
      nicheId: "barber",
      variant: "personal",
      subject: "Și tu probabil ai aceeași problemă...",
      body: `Alo [BUSINESS_NAME],

Lucrez cu bărbierii din București de 2 ani.

Toți zic același lucru: "Pierd clienți pentru că nu pot răspunde la telefon".

Am construit ceva simplu: orice persoană care caută "barber" + locul tău vede disponibilitatea ta ONLINE, fără să-ți sune.

Rezultat: mai puțini "mă suni mâine?", mai mulți confirmed bookings.

Vrei să-l testezi?

Te salut,
[SENDER_NAME]`,
      cta: "Vreau să încerc",
      description: "Personal, relatable, emotional connection"
    }
  ],
  frizerii: [
    {
      id: "frizerii_pro_1",
      nicheId: "frizerii",
      variant: "professional",
      subject: "Rezervări online pentru frizerie",
      body: `Salut,

Frizerii care au integrat ocupaloc.ro raportează 30% mai mulți clienți noi pe lună.

Sistemul:
- Clienții văd când ești liber
- Confirmări automate
- Fără anulări last-minute

Testează 2 săptămâni, 0 lei, 0 angajament.

Vrei link-ul?`,
      cta: "Vreau link-ul",
      description: "Direct value prop, focus on new customer acquisition"
    }
  ],
  saloane: [
    {
      id: "saloane_pro_1",
      nicheId: "saloane",
      variant: "professional",
      subject: "Sistem programări online pentru salon",
      body: `Bună,

Salonul tău merită mai mult trafic. Majoritatea turiștilor și ale clienților noi te caută online, dar nu-ți găsesc disponibilitatea pe telefon.

Am creat un widget care:
- Arată locurile libere în timp real
- Confirmă automat pe email/SMS
- Reduce anulările

2 săptămâni gratis, fără obligație.

Mă contactezi?`,
      cta: "Contact",
      description: "Focus on tourist/new customer discovery"
    }
  ],
  clinici_estetice: [
    {
      id: "clinici_estetice_pro_1",
      nicheId: "clinici_estetice",
      variant: "professional",
      subject: "Creștere 40% consultații: sistem online clinic estetică",
      body: `Bună [BUSINESS_NAME],

Clinici estetice din rețeaua noastră raportează 40% creștere în consultații după ce au integrat rezervări online.

De ce? Clienții noi nu-ți găsesc disponibilitatea, pur și simplu.

Oferim:
- Sincronizare calendar
- Confirmări SMS + Email
- Reduceri administrative

Pilot 14 zile, 0 lei.

Interesa?`,
      cta: "Pilot gratuit",
      description: "Data-driven pitch, focus on consultation volume"
    }
  ],
  stomatologie: [
    {
      id: "stomatologie_pro_1",
      nicheId: "stomatologie",
      variant: "professional",
      subject: "Sistem programări cabinet stomatologic",
      body: `Bună [BUSINESS_NAME],

Cabinet stomatologic modern = programări online.

Pacienții tăi știu asta. Și-ți caută, dar dacă nu e evident, vor la concurență.

Am construit ceva special pentru stomatologie:
- Sincronizare urgențe
- Confirmări SMS (GDPR-compliant)
- Raport zilnic al programărilor

Testează 2 săptămâni gratis.

Răspund la orice întrebare.`,
      cta: "Testez",
      description: "Focus on patient expectations and competition"
    }
  ],
  fizioterapie: [
    {
      id: "fizioterapie_pro_1",
      nicheId: "fizioterapie",
      variant: "professional",
      subject: "Programări online pentru centru fizioterapie",
      body: `Alo [BUSINESS_NAME],

Pacienții cu dureri nu vor sună. Vor vedea disponibilitatea și vor apăsa "book".

Sistemul nostru:
- Calendar sincronizat cu asistente
- Confirmări automate
- Follow-up pentru no-shows

Rezultat: mai puțini pași, mai mulți pacienți.

Hai cu noi?`,
      cta: "Vreau acces",
      description: "Patient behavior insight, low friction booking"
    }
  ],
  masaj_spa: [
    {
      id: "masaj_spa_personal_1",
      nicheId: "masaj_spa",
      variant: "personal",
      subject: "Clienți noi la masaj/spa - TRÈS simple",
      body: `Salut [BUSINESS_NAME],

Turiștii, clientele de corp... toate vor ceva: să vadă când ești liber la masaj/spa, fără să te caute.

Asta e tot. Doar asta.

Am făcut un tool care face asta. Widget pe site, vedere live, book direct.

Testat 2 săptămâni, gratis. Ce-ai de pierdut?`,
      cta: "Îmi interesează",
      description: "Casual tone, focus on tourist/leisure segment"
    }
  ],
  psihologi: [
    {
      id: "psihologi_pro_1",
      nicheId: "psihologi",
      variant: "professional",
      subject: "Sistem rezervări confidențial pentru psihoter",
      body: `Bună [BUSINESS_NAME],

Psihologii din București zic: clienții sunt reticenți să sune, dar pot rezolva online.

Oferim:
- Rezercări discrete
- Confirmări prin email/SMS
- Notă GDPR: zero date public

Testat 2 săptămâni, 0 cost.

Sper să colaborez cu tine.`,
      cta: "Vreau trial",
      description: "Privacy-focused, discrete positioning"
    }
  ],
  nutritionisti: [
    {
      id: "nutritionisti_pro_1",
      nicheId: "nutritionisti",
      variant: "professional",
      subject: "Consultații nutriție online - programări ușoare",
      body: `Salut [BUSINESS_NAME],

Clienții tăi caută "nutriționist + loc meu" și speră să te găsească. Dacă nu apari = se duc la alții.

Sistem ocupaloc:
- Programări online (telemedicină-ready)
- Confirmări automate
- Rapoarte pacient

14 zile gratis.

Connect?`,
      cta: "Încep trial",
      description: "Online-first positioning, telemedicine-ready"
    }
  ]
};

/**
 * Compute win score for a message template based on metrics and lead profile.
 * Score 0-100.
 */
export function computeMessageWinScore(
  metrics: MessageWinMetrics | null,
  lead: LeadProfile,
  options?: { baseScore?: number }
): number {
  const baseScore = options?.baseScore ?? 50;
  let score = baseScore;

  // If we have historical metrics for this message, boost score based on performance
  if (metrics) {
    const metricScore =
      (metrics.replyRate > 0.15 ? 15 : metrics.replyRate > 0.08 ? 10 : 0) + // Reply rate boost
      (metrics.bookingRate > 0.05 ? 15 : metrics.bookingRate > 0.02 ? 10 : 0) + // Booking rate boost
      (metrics.positiveRate > 0.3 ? 10 : 0); // Positive sentiment boost

    score += metricScore;
  }

  // Lead-specific signals
  if (lead.hasWebsite && lead.hasEmail) {
    score += 10; // Well-integrated business
  }
  if (lead.reviewCount && lead.reviewCount > 50) {
    score += 8; // Established, likely to convert
  }
  if (lead.previousContact?.responseType === "positive" && lead.previousContact.daysAgo < 30) {
    score += 15; // Recent positive interaction = higher intent
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Select the best message template for a lead.
 * Returns single recommendation with reasoning.
 */
export function selectMessageTemplate(
  niche: NicheType,
  lead: LeadProfile,
  metricsMap?: Map<string, MessageWinMetrics>
): MessageRecommendation | null {
  const templates = MESSAGE_TEMPLATES[niche] ?? MESSAGE_TEMPLATES.barber;
  if (!templates || templates.length === 0) {
    return null;
  }

  // Score all templates
  const scored = templates.map((template) => {
    const metricKey = `${template.variant}_${niche}`;
    const metrics = metricsMap?.get(metricKey);
    const winScore = computeMessageWinScore(metrics ?? null, lead);

    return {
      template,
      winScore,
      metrics
    };
  });

  // Sort by score, pick top
  const best = scored.sort((a, b) => b.winScore - a.winScore)[0];
  if (!best) {
    return null;
  }

  // Generate reasoning
  const reasoning = generateTemplateReasoning(best.template, best.winScore, best.metrics, lead);

  return {
    template: best.template,
    winScore: best.winScore,
    reasoning
  };
}

/**
 * Generate human-readable explanation of why a template was selected.
 */
function generateTemplateReasoning(
  template: MessageTemplate,
  score: number,
  metrics: MessageWinMetrics | undefined,
  lead: LeadProfile
): string {
  const parts: string[] = [];

  if (metrics && metrics.replyRate > 0.12) {
    parts.push(`Varianta "${template.variant}" are rata reply înaltă (${(metrics.replyRate * 100).toFixed(1)}%) pentru nișa asta.`);
  }

  if (lead.reviewCount && lead.reviewCount > 50) {
    parts.push("Business-ul pare stabil și cu reputație bună.");
  }

  if (lead.hasWebsite && lead.hasEmail) {
    parts.push("Lead-ul e bine integrat digital, probabil mai receptiv la modernizare.");
  }

  parts.push(`Scor estimat conversie: ${Math.round(score)}%.`);

  return parts.length > 0 ? parts.join(" ") : "Template selectat pe bază de istoric de conversie.";
}

/**
 * Interpolate message template with lead data.
 */
export function renderMessageTemplate(
  template: MessageTemplate,
  lead: LeadProfile,
  senderName: string = "ocupaloc.ro"
): { subject: string; body: string } {
  const subject = template.subject
    .replace("[BUSINESS_NAME]", lead.businessName)
    .replace("[SENDER_NAME]", senderName);

  const body = template.body
    .replace(/\[BUSINESS_NAME\]/g, lead.businessName)
    .replace(/\[SENDER_NAME\]/g, senderName);

  return { subject, body };
}
