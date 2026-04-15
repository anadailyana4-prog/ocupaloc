import { redirect } from "next/navigation";

import { ProgramEditor, type ProgramEditorRow } from "./program-editor";
import { parseProgramJson } from "@/lib/program";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type DayKey = (typeof DAY_ORDER)[number];

function timeForInput(t: string | null | undefined): string {
  if (!t) return "09:00";
  const m = String(t).match(/^(\d{2}:\d{2})/);
  return m?.[1] ?? "09:00";
}

function buildInitialRows(
  program: ReturnType<typeof parseProgramJson>
): ProgramEditorRow[] {
  const map: Record<DayKey, keyof ReturnType<typeof parseProgramJson>> = {
    mon: "luni",
    tue: "marti",
    wed: "miercuri",
    thu: "joi",
    fri: "vineri",
    sat: "sambata",
    sun: "duminica"
  };
  return DAY_ORDER.map((day) => {
    const row = program[map[day]];
    if (Array.isArray(row) && row.length === 2) {
      return {
        day,
        start: timeForInput(row[0]),
        end: timeForInput(row[1]),
        closed: false
      };
    }
    return {
      day,
      start: "09:00",
      end: "18:00",
      closed: true
    };
  });
}

export default async function ProgramDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: prof, error } = await supabase.from("profesionisti").select("program").eq("user_id", user.id).maybeSingle();

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 p-4 text-sm text-destructive">
        Nu am putut încărca programul: {error.message}
      </div>
    );
  }

  const initialRows = buildInitialRows(parseProgramJson(prof?.program ?? null));

  return <ProgramEditor initialRows={initialRows} />;
}
