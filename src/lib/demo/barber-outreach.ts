import type { DemoService } from "@/lib/demo/create-demo";

/**
 * Servicii orientative pentru demo barber — ordinea contează: Tuns e serviciul principal.
 */
export const BARBER_OUTREACH_DEMO_SERVICES: DemoService[] = [
  { name: "Tuns", price: 70, label: "Tuns · 45 min · 70 RON" },
  { name: "Tuns + barbă", price: 100, label: "Tuns + barbă · 60 min · 100 RON" },
  { name: "Contur barbă", price: 45, label: "Contur barbă · 20 min · 45 RON" }
];

export type BarberWhatsAppOutreachInput = {
  businessName: string;
  demoUrl: string;
  signupUrl: string;
};

/**
 * Cold WhatsApp scurt: nume salon → durere concretă (apeluri pierdute) → rezultat → demo → profil.
 */
export function buildBarberWhatsAppOutreachMessage(input: BarberWhatsAppOutreachInput) {
  const { businessName, demoUrl, signupUrl } = input;

  return [
    `Bună! Ți-am pregătit pagina de programări pentru ${businessName} — cu Tuns, Tuns+barbă și Contur (prețuri exemplu, le pui tu).`,
    "",
    "La barber, cât timp tunzi sau razi, nu răspunzi la telefon. Clientul sună o dată — dacă nu iei, merge la alt salon. Asta e banii pierduți, nu „mesaje”.",
    "",
    "Cu OcupaLoc clienții văd orele libere și se programează singuri, 24/7. Tu vezi doar agenda — fără comision la fiecare programare, 59,99 lei/lună fix după 14 zile gratuit.",
    "",
    `👉 Vezi ${businessName} în demo: ${demoUrl}`,
    `Creează profilul (datele se precompletează): ${signupUrl}`,
    "",
    "Ai 2 minute să te uiți?"
  ].join("\n");
}
