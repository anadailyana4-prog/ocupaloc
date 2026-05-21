"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { type BookingActionResult, cancelBooking, completeBooking, markNoShow, updateBookingNotes } from "./actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export type ProgramareRow = {
  id: string;
  dataStr: string;
  oraStr: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  status: string;
  notes?: string | null;
  /** Number of prior completed bookings for the same phone number */
  priorVisits?: number;
  /** Number of times this phone has been marked noaparit — for repeat no-show warning */
  repeatNoShows?: number;
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
      return "border-emerald-400/60 bg-emerald-50/80 text-emerald-700";
    case "anulat":
      return "border-red-400/60 bg-red-50/80 text-red-700";
    case "finalizat":
      return "border-slate-300 bg-slate-100/80 text-slate-700";
    case "noaparit":
      return "border-orange-400/60 bg-orange-50/80 text-orange-700";
    default:
      return "border-slate-300 bg-slate-100 text-slate-600";
  }
}

type Props = {
  rows: ProgramareRow[];
};

export function ProgramariTable({ rows }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [cancelTarget, setCancelTarget] = useState<{ id: string; clientName: string } | null>(null);
  const [notesTarget, setNotesTarget] = useState<{ id: string; clientName: string } | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

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

  function confirmCancel(row: ProgramareRow) {
    setCancelTarget({ id: row.id, clientName: row.clientName });
  }

  async function executeCancel() {
    if (!cancelTarget) return;
    const id = cancelTarget.id;
    setCancelTarget(null);
    startTransition(async () => {
      const res = await cancelBooking(id);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success("Programare anulată.");
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
    });
  }

  function openNotes(row: ProgramareRow) {
    setNotesTarget({ id: row.id, clientName: row.clientName });
    setNotesDraft(row.notes ?? "");
  }

  async function saveNotes() {
    if (!notesTarget) return;
    startTransition(async () => {
      const res = await updateBookingNotes(notesTarget.id, notesDraft);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      setNotesTarget(null);
      setNotesDraft("");
      toast.success("Notiță salvată.");
      router.refresh();
    });
  }

  const emptyState = (
    <div className="px-4 py-12 text-center">
      <p className="text-sm font-medium oc-text">Nicio programare în intervalul ales.</p>
      <p className="mt-1 text-xs oc-secondary-text">
        Copiază link-ul paginii tale publice și trimite-l clienților pentru a primi primele rezervări.
      </p>
    </div>
  );

  return (
    <div className="space-y-0">
      {/* Mobile card list — visible only on small screens */}
      <div className="flex flex-col divide-y oc-border rounded-xl border oc-border bg-white md:hidden">
        {rows.length === 0 ? (
          emptyState
        ) : (
          rows.map((r) => {
            const canAct = r.status === "confirmat";
            return (
              <div key={r.id} className="flex flex-col gap-2 px-4 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate font-medium leading-snug">{r.clientName}</p>
                      {r.priorVisits && r.priorVisits > 0 ? (
                        <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
                          {r.priorVisits + 1}. vizită
                        </span>
                      ) : null}
                      {r.repeatNoShows && r.repeatNoShows >= 2 ? (
                        <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800" title="Client cu neprezentări repetate">
                          ⚠ {r.repeatNoShows}× neprezent
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs oc-secondary-text">{r.serviceName}</p>
                  </div>
                  <span className={`shrink-0 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(r.status)}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs oc-secondary-text">
                  <span className="font-mono">{r.dataStr}</span>
                  <span className="font-mono font-semibold oc-accent">{r.oraStr}</span>
                  {r.clientPhone ? (
                    <a href={`tel:${r.clientPhone}`} className="ml-auto font-mono oc-accent hover:underline">
                      {r.clientPhone}
                    </a>
                  ) : null}
                </div>
                {r.notes ? <p className="text-xs oc-secondary-text">Notă: {r.notes}</p> : null}
                {canAct ? (
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-full border-red-300 text-red-700 hover:bg-red-50"
                      disabled={pending}
                      onClick={() => confirmCancel(r)}
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
                      className="rounded-full border-orange-300 text-orange-700 hover:bg-orange-50"
                      disabled={pending}
                      onClick={() => void runNoShow(r)}
                    >
                      Neprezent
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border oc-border oc-text hover:bg-oc-teal-soft"
                      disabled={pending}
                      onClick={() => openNotes(r)}
                    >
                      Notițe
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table — hidden on small screens */}
      <div className="hidden overflow-x-auto rounded-xl border oc-border bg-white md:block">
        <table className="w-full text-sm">
          <thead className="border-b oc-border bg-oc-teal-soft">
            <tr>
              <th className="px-4 py-3 text-left font-medium oc-secondary-text">Data</th>
              <th className="px-4 py-3 text-left font-medium oc-secondary-text">Ora</th>
              <th className="px-4 py-3 text-left font-medium oc-secondary-text">Client</th>
              <th className="px-4 py-3 text-left font-medium oc-secondary-text">Telefon</th>
              <th className="px-4 py-3 text-left font-medium oc-secondary-text">Serviciu</th>
              <th className="px-4 py-3 text-left font-medium oc-secondary-text">Notițe</th>
              <th className="px-4 py-3 text-left font-medium oc-secondary-text">Status</th>
              <th className="px-4 py-3 text-right font-medium oc-secondary-text">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <p className="text-sm font-medium oc-text">Nicio programare în intervalul ales.</p>
                  <p className="mt-1 text-xs oc-secondary-text">
                    Copiază link-ul paginii tale publice și trimite-l clienților pentru a primi primele rezervări.
                  </p>
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const canAct = r.status === "confirmat";
                return (
                  <tr key={r.id} className="border-b oc-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs oc-secondary-text">{r.dataStr}</td>
                    <td className="px-4 py-3 font-mono text-xs oc-secondary-text">{r.oraStr}</td>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span>{r.clientName}</span>
                        {r.priorVisits && r.priorVisits > 0 ? (
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
                            {r.priorVisits + 1}. vizită
                          </span>
                        ) : null}
                        {r.repeatNoShows && r.repeatNoShows >= 2 ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800" title="Client cu neprezentări repetate">
                            ⚠ {r.repeatNoShows}× neprezent
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{r.clientPhone || "—"}</td>
                    <td className="px-4 py-3">{r.serviceName}</td>
                    <td className="px-4 py-3 text-xs oc-secondary-text">{r.notes?.trim() ? r.notes : "—"}</td>
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
                              className="rounded-full border-red-300 text-red-700 hover:bg-red-50"
                              disabled={pending}
                              onClick={() => confirmCancel(r)}
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
                              className="rounded-full border-orange-300 text-orange-700 hover:bg-orange-50"
                              disabled={pending}
                              onClick={() => void runNoShow(r)}
                            >
                              Neprezent
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-full border oc-border oc-text hover:bg-oc-teal-soft"
                              disabled={pending}
                              onClick={() => openNotes(r)}
                            >
                              Notițe
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full border oc-border oc-text hover:bg-oc-teal-soft"
                            disabled={pending}
                            onClick={() => openNotes(r)}
                          >
                            Notițe
                          </Button>
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

      <Dialog open={cancelTarget !== null} onOpenChange={(open) => { if (!open) setCancelTarget(null); }}>
        <DialogContent className="border oc-border bg-white oc-text sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmă anularea</DialogTitle>
            <DialogDescription className="oc-secondary-text">
              Anulezi programarea lui <span className="font-semibold oc-text">{cancelTarget?.clientName}</span>? Clientul va primi un email de notificare.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="secondary" type="button" onClick={() => setCancelTarget(null)}>
              Înapoi
            </Button>
            <Button
              type="button"
              className="bg-red-700 text-white hover:bg-red-600"
              disabled={pending}
              onClick={() => void executeCancel()}
            >
              Da, anulează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={notesTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setNotesTarget(null);
            setNotesDraft("");
          }
        }}
      >
        <DialogContent className="border oc-border bg-white oc-text sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notițe interne</DialogTitle>
            <DialogDescription className="oc-secondary-text">
              Note private pentru programarea lui <span className="font-semibold oc-text">{notesTarget?.clientName}</span>.
            </DialogDescription>
          </DialogHeader>
          <div>
            <textarea
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              maxLength={1000}
              placeholder="Ex: client preferă contact telefonic înainte de sosire"
              className="dash-input min-h-28 py-2"
            />
            <p className="mt-1 text-[11px] oc-secondary-text">Maxim 1000 caractere.</p>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setNotesTarget(null);
                setNotesDraft("");
              }}
            >
              Înapoi
            </Button>
            <Button type="button" disabled={pending} onClick={() => void saveNotes()}>
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
