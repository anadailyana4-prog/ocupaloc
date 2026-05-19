type DemoService = { name?: string; price?: number; label?: string };

export type DemoSignupSeed = {
  orgName: string;
  activity: string;
  services: Array<{ nume: string; pret: string; durata: string }>;
};

const DEMO_TYPE_TO_ACTIVITY: Record<string, string> = {
  Frizerie: "Frizerie/Barber",
  Barber: "Frizerie/Barber",
  Salon: "Salon înfrumusețare",
  "Manichiură": "Manichiură/Pedichiură",
  Cosmetică: "Cosmetică"
};

export function mapDemoRowToSignupSeed(row: {
  business_name: string;
  business_type: string;
  services: unknown;
}): DemoSignupSeed {
  const raw = Array.isArray(row.services) ? (row.services as DemoService[]) : [];
  const services = raw.slice(0, 3).map((service) => ({
    nume: String(service.name ?? "").trim() || "Serviciu",
    pret: String(service.price ?? "").trim() || "0",
    durata: "60"
  }));

  while (services.length < 3) {
    services.push({ nume: "", pret: "", durata: "" });
  }

  return {
    orgName: row.business_name.trim(),
    activity: DEMO_TYPE_TO_ACTIVITY[row.business_type] ?? "Altele",
    services
  };
}
