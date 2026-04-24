"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createService, deleteService, updateService } from "./actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type ServiciuListRow = {
  id: string;
  name: string;
  duration_min: number;
  price: number;
  is_active: boolean | null;
  deleted_at: string | null;
};

type Props = {
  initialServices: ServiciuListRow[];
  orgSlug: string;
};

export function ServiciiManager({ initialServices, orgSlug }: Props) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<ServiciuListRow | null>(null);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState(0);
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    router.refresh();
  };

  function openAdd() {
    setName("");
    setDuration(60);
    setPrice(0);
    setActive(true);
    setAddOpen(true);
  }

  function openEdit(row: ServiciuListRow) {
    setEditRow(row);
    setName(row.name);
    setDuration(row.duration_min);
    setPrice(Number(row.price));
    setActive(row.is_active !== false);
  }

  async function submitCreate() {
    setBusy(true);
    try {
      const res = await createService({ name, duration_min: duration, price, is_active: active });
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success("Serviciu adăugat.");
      setAddOpen(false);
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitUpdate() {
    if (!editRow) return;
    setBusy(true);
    try {
      const res = await updateService(editRow.id, { name, duration_min: duration, price, is_active: active });
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success("Serviciu actualizat.");
      setEditRow(null);
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitDelete(id: string) {
    if (!confirm("Ștergi acest serviciu? (soft delete — dispare din listă și de pe pagina publică.)")) return;
    setBusy(true);
    try {
      const res = await deleteService(id);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success("Serviciu șters.");
      refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 transition">
        ← Înapoi la dashboard
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Servicii</h1>
          <p className="text-sm text-muted-foreground">
            Organizație: <span className="font-mono text-xs">{orgSlug}</span>
          </p>
        </div>
        <Button type="button" onClick={openAdd}>
          + Adaugă serviciu
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-950/80">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Nume</th>
              <th className="px-4 py-3 text-left font-medium">Durată (min)</th>
              <th className="px-4 py-3 text-left font-medium">Preț (RON)</th>
              <th className="px-4 py-3 text-left font-medium">Activ</th>
              <th className="px-4 py-3 text-right font-medium">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {initialServices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Niciun serviciu. Adaugă primul.
                </td>
              </tr>
            ) : (
              initialServices.map((s) => (
                <tr key={s.id} className="border-b border-zinc-900 last:border-0">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.duration_min}</td>
                  <td className="px-4 py-3">{Number(s.price).toFixed(2)}</td>
                  <td className="px-4 py-3">{s.is_active === false ? "Nu" : "Da"}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(s)} disabled={busy}>
                      Editează
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => void submitDelete(s.id)} disabled={busy}>
                      Șterge
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Serviciu nou</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="add-name">Nume</Label>
              <Input id="add-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 border-zinc-700 bg-zinc-900" />
            </div>
            <div>
              <Label htmlFor="add-dur">Durată (min)</Label>
              <Input id="add-dur" type="number" min={1} max={480} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="mt-1 border-zinc-700 bg-zinc-900" />
            </div>
            <div>
              <Label htmlFor="add-price">Preț (RON)</Label>
              <Input id="add-price" type="number" min={0} step={1} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="mt-1 border-zinc-700 bg-zinc-900" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="add-active" checked={active} onCheckedChange={setActive} />
              <Label htmlFor="add-active">Activ</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" type="button" onClick={() => setAddOpen(false)}>
              Anulează
            </Button>
            <Button type="button" disabled={busy} onClick={() => void submitCreate()}>
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editRow !== null} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editează serviciu</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="ed-name">Nume</Label>
              <Input id="ed-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 border-zinc-700 bg-zinc-900" />
            </div>
            <div>
              <Label htmlFor="ed-dur">Durată (min)</Label>
              <Input id="ed-dur" type="number" min={1} max={480} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="mt-1 border-zinc-700 bg-zinc-900" />
            </div>
            <div>
              <Label htmlFor="ed-price">Preț (RON)</Label>
              <Input id="ed-price" type="number" min={0} step={1} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="mt-1 border-zinc-700 bg-zinc-900" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="ed-active" checked={active} onCheckedChange={setActive} />
              <Label htmlFor="ed-active">Activ</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" type="button" onClick={() => setEditRow(null)}>
              Anulează
            </Button>
            <Button type="button" disabled={busy} onClick={() => void submitUpdate()}>
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
