"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { type SlotConfigInput, type WorkingHourRowInput, saveWorkingHours } from "./actions";
import type { ProgramSlotConfig } from "@/lib/program";
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
  initialSlotConfig: ProgramSlotConfig;
};

export function ProgramEditor({ initialRows, initialSlotConfig }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<ProgramEditorRow[]>(initialRows);
  const [slotConfig, setSlotConfig] = useState<SlotConfigInput>({
    strategy: initialSlotConfig.strategy,
    fixedStepMinutes: initialSlotConfig.fixedStepMinutes
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    setSlotConfig({
      strategy: initialSlotConfig.strategy,
      fixedStepMinutes: initialSlotConfig.fixedStepMinutes
    });
  }, [initialSlotConfig]);

  function setRow(day: ProgramEditorRow["day"], patch: Partial<ProgramEditorRow>) {
    setRows((prev) => prev.map((r) => (r.day === day ? { ...r, ...patch } : r)));
  }

  async function onSave() {
    if (slotConfig.strategy === "fixed_step" && (!slotConfig.fixedStepMinutes || slotConfig.fixedStepMinutes < 5)) {
      toast.error("Setează un pas fix valid (minimum 5 minute).");
      return;
    }

    setBusy(true);
    try {
      const payload: SlotConfigInput =
        slotConfig.strategy === "service_duration"
          ? { strategy: "service_duration" }
          : { strategy: "fixed_step", fixedStepMinutes: Number(slotConfig.fixedStepMinutes) };
      const res = await saveWorkingHours({
        hours: rows,
        slotConfig: payload
      });
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
        ← Înapoi la meniu
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

      <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Strategie sloturi publice</h2>
        <p className="text-xs text-zinc-400">Implicit recomandat: porniri aliniate la durata serviciului + pauza dintre clienți.</p>

        <div className="space-y-3">
          <label className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${slotConfig.strategy === "service_duration" ? "border-zinc-500 bg-zinc-800/60" : "border-zinc-800 hover:border-zinc-700"}`}>
            <input
              type="radio"
              name="slot-strategy"
              checked={slotConfig.strategy === "service_duration"}
              onChange={() => setSlotConfig({ strategy: "service_duration" })}
              className="mt-0.5 shrink-0"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-zinc-100">Pe durata serviciului <span className="ml-1 rounded bg-zinc-700 px-1.5 py-0.5 text-xs text-zinc-300">recomandat</span></p>
              <p className="text-xs text-zinc-400">Sloturile pornesc exact când se termină cel anterior. Dacă serviciul durează 60 min, clienții pot alege 09:00, 10:00, 11:00 etc. Ideal pentru saloane, cabinete sau orice business unde fiecare client ocupă tot intervalul.</p>
            </div>
          </label>
          <label className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${slotConfig.strategy === "fixed_step" ? "border-zinc-500 bg-zinc-800/60" : "border-zinc-800 hover:border-zinc-700"}`}>
            <input
              type="radio"
              name="slot-strategy"
              checked={slotConfig.strategy === "fixed_step"}
              onChange={() =>
                setSlotConfig((prev) => ({
                  strategy: "fixed_step",
                  fixedStepMinutes: prev.fixedStepMinutes ?? 15
                }))
              }
              className="mt-0.5 shrink-0"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-zinc-100">Pas fix</p>
              <p className="text-xs text-zinc-400">Sloturile apar la intervale egale indiferent de durata serviciului. De ex. la 5 min: 09:00, 09:05, 09:10... Util dacă oferi mai multe servicii cu durate diferite și vrei ca toți clienții să poată alege din același grid orar.</p>
            </div>
          </label>
        </div>

        {slotConfig.strategy === "fixed_step" ? (
          <div className="max-w-xs space-y-1">
            <Label htmlFor="fixed-step-minutes">Interval între sloturi</Label>
            <select
              id="fixed-step-minutes"
              value={slotConfig.fixedStepMinutes ?? 15}
              onChange={(e) =>
                setSlotConfig({
                  strategy: "fixed_step",
                  fixedStepMinutes: Number(e.target.value)
                })
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              <option value={5}>5 minute</option>
              <option value={10}>10 minute</option>
              <option value={15}>15 minute</option>
              <option value={20}>20 minute</option>
              <option value={30}>30 minute</option>
              <option value={45}>45 minute</option>
              <option value={60}>60 minute</option>
              <option value={90}>90 minute</option>
              <option value={120}>120 minute</option>
            </select>
          </div>
        ) : null}
      </div>

      <Button type="button" disabled={busy} onClick={() => void onSave()}>
        {busy ? "Se salvează…" : "Salvează programul"}
      </Button>
    </div>
  );
}
