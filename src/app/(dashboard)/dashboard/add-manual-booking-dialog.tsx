"use client";

import { useState } from "react";
import { toast } from "sonner";

import { addManualBooking } from "./actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ServiciuOption = { id: string; name: string; duration_min: number };

type Props = {
  servicii: ServiciuOption[];
  onSuccess?: () => void;
};

function todayStr(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function nowTimeStr(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(Math.ceil(d.getMinutes() / 15) * 15 % 60).padStart(2, "0");
  const hAdj = d.getMinutes() >= 45 ? String(d.getHours() + 1).padStart(2, "0") : h;
  return `${hAdj}:${m}`;
}

export function AddManualBookingDialog({ servicii, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [numeClient, setNumeClient] = useState("");
  const [telefonClient, setTelefonClient] = useState("");
  const [emailClient, setEmailClient] = useState("");
  const [serviciuId, setServiciuId] = useState(servicii[0]?.id ?? "");
  const [dataStr, setDataStr] = useState(todayStr());
  const [oraStr, setOraStr] = useState(nowTimeStr());

  function openDialog() {
    setNumeClient("");
    setTelefonClient("");
    setEmailClient("");
    setServiciuId(servicii[0]?.id ?? "");
    setDataStr(todayStr());
    setOraStr(nowTimeStr());
    setOpen(true);
  }

  async function submit() {
    setBusy(true);
    try {
      const res = await addManualBooking({ numeClient, telefonClient, emailClient: emailClient.trim() || undefined, serviciuId, dataStr, oraStr });
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      if (res.emailSent) {
        toast.success("Programare adăugată. Email de confirmare trimis clientului.");
      } else {
        toast.success("Programare adăugată. Nu s-a trimis email (adresa clientului lipsă).");
      }
      setOpen(false);
      onSuccess?.();
    } finally {
      setBusy(false);
    }
  }

  if (servicii.length === 0) {
    return (
      <Button type="button" variant="outline" size="sm" className="rounded-full" disabled title="Adaugă servicii înainte să creezi programări.">
        + Programare manuală
      </Button>
    );
  }

  return (
    <>
      <Button type="button" onClick={openDialog} size="sm" className="rounded-full border-0 bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 text-slate-900 hover:brightness-105">
        + Programare manuală
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adaugă programare manuală</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="mb-client">Nume client</Label>
              <Input
                id="mb-client"
                value={numeClient}
                onChange={(e) => setNumeClient(e.target.value)}
                placeholder="ex: Maria Ionescu"
                className="mt-1 border-zinc-700 bg-zinc-900"
              />
            </div>
            <div>
              <Label htmlFor="mb-tel">Telefon client</Label>
              <Input
                id="mb-tel"
                type="tel"
                value={telefonClient}
                onChange={(e) => setTelefonClient(e.target.value)}
                placeholder="ex: 07xx xxx xxx"
                className="mt-1 border-zinc-700 bg-zinc-900"
              />
            </div>
            <div>
              <Label htmlFor="mb-email">
                Email client{" "}
                <span className="text-xs text-zinc-400">(opțional — se trimite confirmare)</span>
              </Label>
              <Input
                id="mb-email"
                type="email"
                value={emailClient}
                onChange={(e) => setEmailClient(e.target.value)}
                placeholder="ex: maria@exemplu.ro"
                className="mt-1 border-zinc-700 bg-zinc-900"
              />
            </div>
            <div>
              <Label htmlFor="mb-svc">Serviciu</Label>
              <select
                id="mb-svc"
                value={serviciuId}
                onChange={(e) => setServiciuId(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                {servicii.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration_min} min)
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mb-data">Data</Label>
                <Input
                  id="mb-data"
                  type="date"
                  value={dataStr}
                  onChange={(e) => setDataStr(e.target.value)}
                  className="mt-1 border-zinc-700 bg-zinc-900"
                />
              </div>
              <div>
                <Label htmlFor="mb-ora">Ora</Label>
                <Input
                  id="mb-ora"
                  type="time"
                  value={oraStr}
                  onChange={(e) => setOraStr(e.target.value)}
                  className="mt-1 border-zinc-700 bg-zinc-900"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button type="button" disabled={busy || !numeClient.trim() || !telefonClient.trim() || !serviciuId} onClick={() => void submit()}>
              {busy ? "Se salvează…" : "Adaugă programare"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
