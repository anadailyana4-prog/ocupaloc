import type { SupabaseClient } from "@supabase/supabase-js";
import { canAcceptBookings } from "@/lib/billing/entitlement";

export type BookingEntitlementResult = {
  allowed: boolean;
  reason: string;
};

export async function checkBookingEntitlement(
  admin: SupabaseClient,
  profesionistId: string,
  profesionistCreatedAt: string
): Promise<BookingEntitlementResult> {
  return canAcceptBookings(profesionistId, {
    admin,
    profesionistCreatedAt
  });
}

