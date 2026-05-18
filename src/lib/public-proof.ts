import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export type PublicProofMetrics = {
  confirmedBookings30d: number;
  activeBusinesses30d: number;
  confirmedBookings30dType: "derived";
  activeBusinesses30dType: "derived";
  invoicedRevenue30dType: "billed";
};

export async function getPublicProofMetrics(): Promise<PublicProofMetrics> {
  const admin = createSupabaseServiceClient();
  const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: bookings } = await admin
    .from("programari")
    .select("profesionist_id")
    .eq("status", "confirmat")
    .gte("created_at", sinceIso)
    .limit(5000);

  const confirmedBookings30d = bookings?.length ?? 0;
  const activeBusinesses30d = new Set((bookings ?? []).map((row) => row.profesionist_id)).size;

  return {
    confirmedBookings30d,
    activeBusinesses30d,
    confirmedBookings30dType: "derived",
    activeBusinesses30dType: "derived",
    invoicedRevenue30dType: "billed"
  };
}
