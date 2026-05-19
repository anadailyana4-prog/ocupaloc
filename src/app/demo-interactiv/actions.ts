"use server";

import {
  createDemoRecord,
  DEMO_BUSINESS_TYPES,
  DEMO_CITIES,
  getDemoServicesForType
} from "@/lib/demo/create-demo";

type CreateDemoInput = {
  businessName: string;
  businessType: string;
  city: string;
  services: Array<string | { name?: string; price?: number; label?: string }>;
};

export async function createDemo(input: CreateDemoInput) {
  return createDemoRecord({
    businessName: input.businessName,
    businessType: input.businessType as (typeof DEMO_BUSINESS_TYPES)[number],
    city: input.city as (typeof DEMO_CITIES)[number],
    services: input.services
  });
}

export { getDemoServicesForType };
