import { nanoid } from "nanoid";

import { BARBER_OUTREACH_DEMO_SERVICES } from "@/lib/demo/barber-outreach";
import { DEMO_LINK_VALID_MS } from "@/lib/demo/constants";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export const DEMO_BUSINESS_NAME_REGEX = /^[a-zA-Z0-9ăâîșțĂÂÎȘȚ\s\-]{3,40}$/;

export const DEMO_BUSINESS_TYPES = ["Frizerie", "Salon", "Manichiură", "Cosmetică", "Barber"] as const;
export type DemoBusinessType = (typeof DEMO_BUSINESS_TYPES)[number];

export const DEMO_CITIES = [
  "București",
  "Cluj-Napoca",
  "Timișoara",
  "Iași",
  "Constanța",
  "Brașov",
  "Sibiu",
  "Oradea",
  "Craiova"
] as const;

export type DemoCity = (typeof DEMO_CITIES)[number];

export type DemoService = { name: string; price: number; label: string };

export function getDemoServicesForType(businessType: string): DemoService[] {
  const byType: Record<string, DemoService[]> = {
    Frizerie: [
      { name: "Tuns bărbați", price: 60, label: "Tuns bărbați 60 RON" },
      { name: "Tuns + barbă", price: 90, label: "Tuns + barbă 90 RON" },
      { name: "Spălat + aranjat", price: 40, label: "Spălat + aranjat 40 RON" }
    ],
    Salon: [
      { name: "Tuns + coafat", price: 120, label: "Tuns + coafat 120 RON" },
      { name: "Vopsit rădăcină", price: 180, label: "Vopsit rădăcină 180 RON" },
      { name: "Tratament păr", price: 150, label: "Tratament păr 150 RON" }
    ],
    "Manichiură": [
      { name: "Manichiură clasică", price: 80, label: "Manichiură clasică 80 RON" },
      { name: "Gel", price: 120, label: "Gel 120 RON" },
      { name: "Întreținere", price: 90, label: "Întreținere 90 RON" }
    ],
    Cosmetică: [
      { name: "Curățare ten", price: 150, label: "Curățare ten 150 RON" },
      { name: "Tratament facial", price: 200, label: "Tratament facial 200 RON" },
      { name: "Pensat + vopsit", price: 70, label: "Pensat + vopsit 70 RON" }
    ],
    Barber: BARBER_OUTREACH_DEMO_SERVICES
  };

  return byType[businessType] ?? [];
}

export type CreateDemoRecordInput = {
  businessName: string;
  businessType: DemoBusinessType;
  city: DemoCity;
  services: Array<string | { name?: string; price?: number; label?: string }>;
};

export function buildDemoSignupPath(demoId: string, businessName: string) {
  return `/signup?demo=${demoId}&name=${encodeURIComponent(businessName)}`;
}

export function buildDemoUrls(siteUrl: string, demoId: string, businessName: string) {
  const base = siteUrl.replace(/\/$/, "");
  return {
    demoUrl: `${base}/demo/${demoId}`,
    signupUrl: `${base}${buildDemoSignupPath(demoId, businessName)}`
  };
}

export async function createDemoRecord(input: CreateDemoRecordInput) {
  const { businessName, businessType, city, services } = input;

  if (!DEMO_BUSINESS_TYPES.includes(businessType)) {
    return { ok: false as const, error: "Tip business invalid" };
  }
  if (!DEMO_CITIES.includes(city)) {
    return { ok: false as const, error: "Oraș invalid" };
  }
  if (!DEMO_BUSINESS_NAME_REGEX.test(businessName)) {
    return { ok: false as const, error: "Nume invalid" };
  }
  if (!Array.isArray(services) || services.length !== 3) {
    return { ok: false as const, error: "Servicii invalide" };
  }

  const validServices = getDemoServicesForType(businessType);
  try {
    const normalizedServices = services.map((service) => {
      if (typeof service === "string") {
        const match = validServices.find((s) => s.label === service);
        if (!match) throw new Error("Serviciu invalid");
        return { name: match.name, price: match.price, label: match.label };
      }

      const found = validServices.find((s) => s.name === service.name && s.price === service.price);
      if (!found) throw new Error("Serviciu invalid");
      return { name: found.name, price: found.price, label: found.label };
    });

    const supabase = createSupabaseServiceClient();
    const id = nanoid(8);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DEMO_LINK_VALID_MS);

    const { error } = await supabase.from("demos").insert({
      id,
      business_name: businessName,
      business_type: businessType,
      city,
      services: normalizedServices,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString()
    });

    if (error) {
      return { ok: false as const, error: error.message };
    }

    return { ok: true as const, id };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Nu am putut crea demo-ul."
    };
  }
}

/** Demo barber pentru outreach (servicii orientative, oraș default București). */
export async function createBarberOutreachDemo(businessName: string) {
  return createDemoRecord({
    businessName,
    businessType: "Barber",
    city: "București",
    services: BARBER_OUTREACH_DEMO_SERVICES.map((s) => s.label)
  });
}
