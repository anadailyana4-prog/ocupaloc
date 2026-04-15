"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

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

export type WorkingHourRowInput = z.infer<typeof hourRowSchema>;

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
