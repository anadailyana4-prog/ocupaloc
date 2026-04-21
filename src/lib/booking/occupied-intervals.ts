import type { SupabaseClient } from "@supabase/supabase-js";

import type { IntervalOccupat } from "@/lib/slots";

type OccupiedInput = {
  profesionistId: string;
  startDayIso: string;
  endDayIso: string;
  excludeProgramareId?: string;
};

export async function getOccupiedIntervals(admin: SupabaseClient, input: OccupiedInput): Promise<IntervalOccupat[]> {
  const bookingQuery = admin
    .from("programari")
    .select("id,data_start,data_final,status")
    .eq("profesionist_id", input.profesionistId)
    .neq("status", "anulat")
    .lt("data_start", input.endDayIso)
    .gt("data_final", input.startDayIso);

  const effectiveBookingQuery = input.excludeProgramareId ? bookingQuery.neq("id", input.excludeProgramareId) : bookingQuery;

  const [bookingRes, blocksRes] = await Promise.all([
    effectiveBookingQuery,
    admin
      .from("programari_blocaje")
      .select("id,start_at,end_at")
      .eq("profesionist_id", input.profesionistId)
      .lt("start_at", input.endDayIso)
      .gt("end_at", input.startDayIso)
  ]);

  const bookingIntervals: IntervalOccupat[] = (bookingRes.data ?? [])
    .map((row) => ({
      start: new Date(String(row.data_start)),
      end: new Date(String(row.data_final))
    }))
    .filter((row) => Number.isFinite(row.start.getTime()) && Number.isFinite(row.end.getTime()) && row.end > row.start);

  const blockIntervals: IntervalOccupat[] = (blocksRes.data ?? [])
    .map((row) => ({
      start: new Date(String(row.start_at)),
      end: new Date(String(row.end_at))
    }))
    .filter((row) => Number.isFinite(row.start.getTime()) && Number.isFinite(row.end.getTime()) && row.end > row.start);

  return [...bookingIntervals, ...blockIntervals].sort((a, b) => a.start.getTime() - b.start.getTime());
}
