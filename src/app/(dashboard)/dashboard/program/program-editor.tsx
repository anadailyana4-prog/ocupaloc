"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { type WorkingHourRowInput, saveWorkingHours } from "./actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<(typeof DAY_ORDER)[number], string> = {
  mon: "Luni",
  tue: "Marți",
  wed: "Miercuri",
  thu: "Joi",
  fri: "Vineri",
  sat: "Sâmbătă",
  sun: "Duminică"
};

export type ProgramEditorRow = WorkingHourRowInput;

type Props = {
  initialRows: ProgramEditorRow[];
};

export function ProgramEditor({ initialRows }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<ProgramEditorRow[]>(initialRows);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  function setRow(day: ProgramEditorRow["day"], patch: Partial<ProgramEditorRow>) {
    setRows((prev) => prev.map((r) => (r.day === day ? { ...r, ...patch } : r)));
  }

  async function onSave() {
    setBusy(true);
    try {
      const res = await saveWorkingHours(rows);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success("Program salvat.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 transition">
        ← Înapoi la dashboard
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Program</h1>
        <p className="text-sm text-muted-foreground">Orele tale de lucru (vizibile pe pagina publică de rezervare).</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-950/80">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Zi</th>
              <th className="px-4 py-3 text-left font-medium">Start</th>
              <th className="px-4 py-3 text-left font-medium">End</th>
              <th className="px-4 py-3 text-left font-medium">Închis</th>
            </tr>
          </thead>
          <tbody>
            {DAY_ORDER.map((day) => {
              const r = rows.find((x) => x.day === day)!;
              const closed = r.closed;
              return (
                <tr key={day} className="border-b border-zinc-900 last:border-0">
                  <td className="px-4 py-3 font-medium">{DAY_LABELS[day]}</td>
                  <td className="px-4 py-3">
                    <input
                      type="time"
                      value={r.start}
                      disabled={closed}
                      onChange={(e) => setRow(day, { start: e.target.value })}
                      className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-white disabled:opacity-40"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="time"
                      value={r.end}
                      disabled={closed}
                      onChange={(e) => setRow(day, { end: e.target.value })}
                      className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-white disabled:opacity-40"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Checkbox id={`closed-${day}`} checked={closed} onCheckedChange={(v) => setRow(day, { closed: v === true })} />
                      <Label htmlFor={`closed-${day}`} className="text-muted-foreground font-normal cursor-pointer">
                        Închis
                      </Label>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button type="button" disabled={busy} onClick={() => void onSave()}>
        {busy ? "Se salvează…" : "Salvează programul"}
      </Button>
    </div>
  );
}
