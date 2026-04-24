"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { type BookingActionResult, cancelBooking, completeBooking } from "./actions";
import { Button } from "@/components/ui/button";

export type ProgramareRow = {
  id: string;
  dataStr: string;
  oraStr: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  status: string;
};

const STATUS_LABEL: Record<string, string> = {
  confirmat: "Confirmat",
  anulat: "Anulat",
  finalizat: "Finalizat",
  in_asteptare: "În așteptare"
};

function statusBadgeClass(s: string) {
  switch (s) {
    case "confirmat":
      return "border-emerald-500/40 bg-emerald-950/50 text-emerald-300";
    case "anulat":
      return "border-red-500/40 bg-red-950/40 text-red-300";
    case "finalizat":
      return "border-zinc-600 bg-zinc-800/80 text-zinc-300";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-400";
  }
}

type Props = {
  rows: ProgramareRow[];
};

export function ProgramariTable({ rows }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function run(label: string, fn: () => Promise<BookingActionResult>) {
    startTransition(async () => {
      const res = await fn();
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(label);
      router.refresh();
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[880px] text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-950/80">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Data</th>
            <th className="px-4 py-3 text-left font-medium">Ora</th>
            <th className="px-4 py-3 text-left font-medium">Client</th>
            <th className="px-4 py-3 text-left font-medium">Telefon</th>
            <th className="px-4 py-3 text-left font-medium">Serviciu</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center">
                <p className="text-sm font-medium text-amber-100/70">Nicio programare în intervalul ales.</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Copiază link-ul paginii tale publice și trimite-l clienților pentru a primi primele rezervări.
                </p>
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const canAct = r.status === "confirmat";
              return (
                <tr key={r.id} className="border-b border-zinc-900 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-300">{r.dataStr}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-300">{r.oraStr}</td>
                  <td className="px-4 py-3 font-medium">{r.clientName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.clientPhone || "—"}</td>
                  <td className="px-4 py-3">{r.serviceName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(r.status)}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {canAct ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full border-red-500/40 text-red-300 hover:bg-red-950/40"
                            disabled={pending}
                            onClick={() => void run("Programare anulată.", () => cancelBooking(r.id))}
                          >
                            Anulează
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-full bg-emerald-700 text-white hover:bg-emerald-600"
                            disabled={pending}
                            onClick={() => void run("Marcată ca finalizată.", () => completeBooking(r.id))}
                          >
                            Marchează finalizat
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
