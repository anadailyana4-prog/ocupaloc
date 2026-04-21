"use client";

import { formatInTimeZone } from "date-fns-tz";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { addBreakBlock, deleteBreakBlock } from "./actions";
import { Button } from "@/components/ui/button";

export type ProgramBreakRow = {
  id: string;
  startIso: string;
  endIso: string;
  label: string;
  durationMin: number;
};

type Props = {
  rows: ProgramBreakRow[];
};

function todayDateInputValue(): string {
  return formatInTimeZone(new Date(), "Europe/Bucharest", "yyyy-MM-dd");
}

export function BreaksManager({ rows }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState(todayDateInputValue());
  const [start, setStart] = useState("13:00");
  const [durationMin, setDurationMin] = useState(30);
  const [note, setNote] = useState("Pauză");

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime()),
    [rows]
  );

  function submitBreak() {
    startTransition(async () => {
      const res = await addBreakBlock({ date, start, durationMin, note });
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success("Pauza a fost adăugată.");
      router.refresh();
    });
  }

  function removeBreak(blockId: string) {
    startTransition(async () => {
      const res = await deleteBreakBlock({ blockId });
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success("Pauza a fost ștearsă.");
      router.refresh();
    });
  }

  return (
    <section className="space-y-4 rounded-lg border border-zinc-800 p-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Pauze și blocaje</h2>
        <p className="text-sm text-muted-foreground">Intervalele de pauză sunt tratate ca ocupate și nu apar ca sloturi libere.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <label className="space-y-1 text-sm">
          <span className="text-zinc-300">Data</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 text-white"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-zinc-300">Ora start</span>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 text-white"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-zinc-300">Durată (minute)</span>
          <input
            type="number"
            min={5}
            max={240}
            step={5}
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value || 0))}
            className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 text-white"
          />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-zinc-300">Notă</span>
          <input
            type="text"
            maxLength={160}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 text-white"
          />
        </label>
      </div>

      <Button type="button" onClick={submitBreak} disabled={pending}>
        {pending ? "Se salvează..." : "Adaugă pauză"}
      </Button>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-950/80">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Data</th>
              <th className="px-4 py-3 text-left font-medium">Interval</th>
              <th className="px-4 py-3 text-left font-medium">Durată</th>
              <th className="px-4 py-3 text-left font-medium">Notă</th>
              <th className="px-4 py-3 text-right font-medium">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nu ai pauze configurate.
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => {
                const startAt = new Date(row.startIso);
                const endAt = new Date(row.endIso);
                return (
                  <tr key={row.id} className="border-b border-zinc-900 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">{formatInTimeZone(startAt, "Europe/Bucharest", "dd.MM.yyyy")}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                      {formatInTimeZone(startAt, "Europe/Bucharest", "HH:mm")} - {formatInTimeZone(endAt, "Europe/Bucharest", "HH:mm")}
                    </td>
                    <td className="px-4 py-3">{row.durationMin} min</td>
                    <td className="px-4 py-3">{row.label}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full border-red-500/40 text-red-300 hover:bg-red-950/40"
                        disabled={pending}
                        onClick={() => removeBreak(row.id)}
                      >
                        Șterge
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
