"use server";

import { addMinutes, isBefore } from "date-fns";
import { toDate } from "date-fns-tz";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getOccupiedIntervals } from "@/lib/booking/occupied-intervals";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type ProgramDay = (typeof DAY_ORDER)[number];

const hourRowSchema = z.object({
  day: z.enum(DAY_ORDER),
  start: z.string().min(1),
  end: z.string().min(1),
  closed: z.boolean()
});

const hoursSchema = z.array(hourRowSchema).length(7);

type SupabaseServer = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function getProf(supabase: SupabaseServer): Promise<{ id: string; slug: string } | null> {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: prof } = await supabase.from("profesionisti").select("id, slug").eq("user_id", user.id).maybeSingle();
  if (!prof?.id || !prof.slug) return null;
  return { id: prof.id, slug: prof.slug };
}

function toTimeWithSeconds(t: string): string {
  const s = t.trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
  throw new Error("Format oră invalid (HH:MM).");
}

function minutesFromTime(t: string): number {
  const norm = toTimeWithSeconds(t);
  const [h, m] = norm.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

export type SaveWorkingHoursResult = { success: true } | { success: false; message: string };
export type SaveBreakBlockResult = { success: true } | { success: false; message: string };

export type WorkingHourRowInput = z.infer<typeof hourRowSchema>;

const breakSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  durationMin: z.number().int().min(5).max(240),
  note: z.string().max(160).optional().default("")
});

const breakDeleteSchema = z.object({
  blockId: z.string().uuid()
});

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return isBefore(aStart, bEnd) && isBefore(bStart, aEnd);
}

export async function saveWorkingHours(hours: WorkingHourRowInput[]): Promise<SaveWorkingHoursResult> {
  const parsed = hoursSchema.safeParse(hours);
  if (!parsed.success) {
    return { success: false, message: "Trimite exact 7 zile cu date valide." };
  }

  const days = new Set(parsed.data.map((h) => h.day));
  if (days.size !== 7) {
    return { success: false, message: "Fiecare zi trebuie să apară o singură dată." };
  }

  for (const h of parsed.data) {
    if (h.closed) continue;
    try {
      if (minutesFromTime(h.start) >= minutesFromTime(h.end)) {
        return { success: false, message: `În ${h.day}, start trebuie să fie înainte de end.` };
      }
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : "Oră invalidă." };
    }
  }

  const supabase = await createSupabaseServerClient();
  const prof = await getProf(supabase);
  if (!prof) {
    return { success: false, message: "Nu ești autentificat." };
  }
  const DAY_LABELS: Record<ProgramDay, string> = {
    mon: "luni",
    tue: "marti",
    wed: "miercuri",
    thu: "joi",
    fri: "vineri",
    sat: "sambata",
    sun: "duminica"
  };
  const program = parsed.data.reduce<Record<string, [string, string] | []>>((acc, row) => {
    acc[DAY_LABELS[row.day]] = row.closed ? [] : [toTimeWithSeconds(row.start).slice(0, 5), toTimeWithSeconds(row.end).slice(0, 5)];
    return acc;
  }, {});
  const { error: updateErr } = await supabase.from("profesionisti").update({ program }).eq("id", prof.id);
  if (updateErr) {
    return { success: false, message: updateErr.message };
  }

  revalidatePath("/dashboard/program");
  revalidatePath(`/${prof.slug}`);

  return { success: true };
}

export async function addBreakBlock(input: {
  date: string;
  start: string;
  durationMin: number;
  note?: string;
}): Promise<SaveBreakBlockResult> {
  const parsed = breakSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Datele pentru pauză nu sunt valide." };
  }

  const supabase = await createSupabaseServerClient();
  const prof = await getProf(supabase);
  if (!prof) {
    return { success: false, message: "Nu ești autentificat." };
  }

  const startAt = toDate(`${parsed.data.date}T${parsed.data.start}:00`, { timeZone: "Europe/Bucharest" });
  if (!Number.isFinite(startAt.getTime())) {
    return { success: false, message: "Ora de start este invalidă." };
  }
  const endAt = addMinutes(startAt, parsed.data.durationMin);

  const startDay = `${parsed.data.date}T00:00:00.000Z`;
  const endDay = `${parsed.data.date}T23:59:59.999Z`;
  const ocupate = await getOccupiedIntervals(supabase, {
    profesionistId: prof.id,
    startDayIso: startDay,
    endDayIso: endDay
  });

  const hasClash = ocupate.some((it) => rangesOverlap(startAt, endAt, it.start, it.end));
  if (hasClash) {
    return { success: false, message: "Pauza se suprapune cu o programare sau un blocaj existent." };
  }

  const { error } = await supabase.from("programari_blocaje").insert({
    profesionist_id: prof.id,
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    note: parsed.data.note?.trim() || null
  });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/program");
  revalidatePath(`/${prof.slug}`);

  return { success: true };
}

export async function deleteBreakBlock(input: { blockId: string }): Promise<SaveBreakBlockResult> {
  const parsed = breakDeleteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "ID blocaj invalid." };
  }

  const supabase = await createSupabaseServerClient();
  const prof = await getProf(supabase);
  if (!prof) {
    return { success: false, message: "Nu ești autentificat." };
  }

  const { error } = await supabase
    .from("programari_blocaje")
    .delete()
    .eq("id", parsed.data.blockId)
    .eq("profesionist_id", prof.id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/program");
  revalidatePath(`/${prof.slug}`);

  return { success: true };
}
