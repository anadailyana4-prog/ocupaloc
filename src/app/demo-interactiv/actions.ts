"use server";

import { nanoid } from "nanoid";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type CreateDemoInput = {
  businessName: string;
  businessType: string;
  city: string;
  services: Array<string | { name?: string; price?: number; label?: string }>;
};

const VALID_TYPES = ["Frizerie", "Salon", "Manichiură", "Cosmetică", "Barber"] as const;
const VALID_CITIES = ["București", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Brașov", "Sibiu", "Oradea", "Craiova"] as const;
const NAME_REGEX = /^[a-zA-Z0-9ăâîșțĂÂÎȘȚ\s\-]{3,40}$/;

function getServicesForType(businessType: string): Array<{ name: string; price: number; label: string }> {
  const byType: Record<string, Array<{ name: string; price: number; label: string }>> = {
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
    "Cosmetică": [
      { name: "Curățare ten", price: 150, label: "Curățare ten 150 RON" },
      { name: "Tratament facial", price: 200, label: "Tratament facial 200 RON" },
      { name: "Pensat + vopsit", price: 70, label: "Pensat + vopsit 70 RON" }
    ],
    Barber: [
      { name: "Fade", price: 80, label: "Fade 80 RON" },
      { name: "Tuns + barbă premium", price: 120, label: "Tuns + barbă premium 120 RON" },
      { name: "Contur barbă", price: 50, label: "Contur barbă 50 RON" }
    ]
  };

  return byType[businessType] ?? [];
}

export async function createDemo(input: CreateDemoInput) {
  try {
    const { businessName, businessType, city, services } = input;

    if (!VALID_TYPES.includes(businessType as (typeof VALID_TYPES)[number])) {
      throw new Error("Tip business invalid");
    }
    if (!VALID_CITIES.includes(city as (typeof VALID_CITIES)[number])) {
      throw new Error("Oraș invalid");
    }
    if (!NAME_REGEX.test(businessName)) {
      throw new Error("Nume invalid");
    }
    if (!Array.isArray(services) || services.length !== 3) {
      throw new Error("Servicii invalide");
    }

    const validServices = getServicesForType(businessType);
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
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

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
    return { ok: false as const, error: error instanceof Error ? error.message : "Nu am putut crea demo-ul." };
  }
}

