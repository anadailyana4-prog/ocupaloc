"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { type BookingActionResult, cancelBooking, completeBooking, markNoShow } from "./actions";
import { Button } from "@/components/ui/button";

export type ProgramareRow = {
  id: string;
  dataStr: string;
  oraStr: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  status: string;
  /** Number of prior completed bookings for the same phone number */
  priorVisits?: number;
};

const STATUS_LABEL: Record<string, string> = {
  confirmat: "Confirmat",
  anulat: "Anulat",
  finalizat: "Finalizat",
  in_asteptare: "În așteptare",
  noaparit: "Neprezent"
};

function statusBadgeClass(s: string) {
  switch (s) {
    case "confirmat":
      return "border-emerald-500/40 bg-emerald-950/50 text-emerald-300";
    case "anulat":
      return "border-red-500/40 bg-red-950/40 text-red-300";
    case "finalizat":
      return "border-zinc-600 bg-zinc-800/80 text-zinc-300";
    case "noaparit":
      return "border-orange-500/40 bg-orange-950/40 text-orange-300";
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

  async function runNoShow(row: ProgramareRow) {
    startTransition(async () => {
      const res = await markNoShow(row.id);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success("Marcat ca neprezent.");
      router.refresh();
      // Recovery prompt: suggest contacting the client via WhatsApp
      if (row.clientPhone) {
        const waUrl = `https://wa.me/${row.clientPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Salut ${row.clientName}, am observat că nu ai ajuns la programarea de azi. Vrei să stabilim o altă dată?`)}`;
        toast("Contactezi clientul pe WhatsApp?", {
          duration: 8000,
          action: {
            label: "Deschide WhatsApp →",
            onClick: () => { window.open(waUrl, "_blank", "noopener"); }
          }
        });
      }
    });
  }

  const emptyState = (
    <div className="px-4 py-12 text-center">
      <p className="text-sm font-medium text-amber-100/70">Nicio programare în intervalul ales.</p>
      <p className="mt-1 text-xs text-zinc-500">
        Copiază link-ul paginii tale publice și trimite-l clienților pentru a primi primele rezervări.
      </p>
    </div>
  );

  return (
    <div className="space-y-0">
      {/* Mobile card list — visible only on small screens */}
      <div className="flex flex-col divide-y divide-zinc-900 rounded-xl border border-zinc-800 md:hidden">
        {rows.length === 0 ? (
          emptyState
        ) : (
          rows.map((r) => {
            const canAct = r.status === "confirmat";
            return (
              <div key={r.id} className="flex flex-col gap-2 px-4 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium leading-snug">{r.clientName}</p>
                      {r.priorVisits && r.priorVisits > 0 ? (
                        <span className="shrink-0 rounded-full bg-violet-900/60 px-2 py-0.5 text-xs font-medium text-violet-300">
                          {r.priorVisits + 1}. vizită
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-400">{r.serviceName}</p>
                  </div>
                  <span className={`shrink-0 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(r.status)}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span className="font-mono">{r.dataStr}</span>
                  <span className="font-mono font-semibold text-amber-100/80">{r.oraStr}</span>
                  {r.clientPhone ? (
                    <a href={`tel:${r.clientPhone}`} className="ml-auto font-mono text-cyan-400 hover:underline">
                      {r.clientPhone}
                    </a>
                  ) : null}
                </div>
                {canAct ? (
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-full border-red-500/40 text-red-300 hover:bg-red-950/40"
                      disabled={pending}
                      onClick={() => void run("Programare anulată.", () => cancelBooking(r.id))}
                    >
                      Anulează
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1 rounded-full bg-emerald-700 text-white hover:bg-emerald-600"
                      disabled={pending}
                      onClick={() => void run("Finalizat.", () => completeBooking(r.id))}
                    >
                      Finalizat
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-orange-500/40 text-orange-300 hover:bg-orange-950/40"
                      disabled={pending}
                      onClick={() => void runNoShow(r)}
                    >
                      Neprezent
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table — hidden on small screens */}
      <div className="hidden overflow-x-auto rounded-xl border border-zinc-800 md:block">
        <table className="w-full text-sm">
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
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <span>{r.clientName}</span>
                        {r.priorVisits && r.priorVisits > 0 ? (
                          <span className="rounded-full bg-violet-900/60 px-2 py-0.5 text-xs font-medium text-violet-300">
                            {r.priorVisits + 1}. vizită
                          </span>
                        ) : null}
                      </div>
                    </td>
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
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-full border-orange-500/40 text-orange-300 hover:bg-orange-950/40"
                              disabled={pending}
                              onClick={() => void runNoShow(r)}
                            >
                              Neprezent
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
    </div>
  );
}
