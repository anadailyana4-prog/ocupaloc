"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createStaffProgramare } from "@/actions/programari-admin";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const newProgSchema = z.object({
  serviciuId: z.string().min(1, "Alege un serviciu."),
  dataStartLocal: z.string().min(1, "Alege data și ora."),
  numeClient: z.string().min(2, "Numele e prea scurt."),
  telefonClient: z.string().min(8, "Introdu un telefon valid.")
});

type NewProgForm = z.infer<typeof newProgSchema>;

type ServiciuOpt = { id: string; nume: string; durata_minute: number };

export function AdminShell({
  children,
  profId,
  logoUrl,
  serviciiCount,
  publicSlug
}: {
  children: React.ReactNode;
  profId: string | null;
  logoUrl: string | null;
  serviciiCount: number;
  publicSlug: string | null;
}) {
  const router = useRouter();
  const [npOpen, setNpOpen] = useState(false);
  const [servicii, setServicii] = useState<ServiciuOpt[]>([]);

  const form = useForm<NewProgForm>({
    resolver: zodResolver(newProgSchema),
    defaultValues: {
      serviciuId: "",
      dataStartLocal: "",
      numeClient: "",
      telefonClient: ""
    }
  });

  const loadServicii = useCallback(async () => {
    if (!profId) return;
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.from("servicii").select("id,nume,durata_minute").eq("profesionist_id", profId).eq("activ", true).order("ordine");
    setServicii(data ?? []);
  }, [profId]);

  useEffect(() => {
    if (npOpen) void loadServicii();
  }, [npOpen, loadServicii]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "n" && e.key !== "N") return;
      if (!profId) return;
      e.preventDefault();
      form.reset({ serviciuId: "", dataStartLocal: "", numeClient: "", telefonClient: "" });
      setNpOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [profId, form]);

  async function onSubmit(values: NewProgForm) {
    const start = new Date(values.dataStartLocal);
    if (Number.isNaN(start.getTime())) {
      toast.error("Dată/oră invalidă.");
      return;
    }
    const res = await createStaffProgramare({
      serviciuId: values.serviciuId,
      dataStartIso: start.toISOString(),
      numeClient: values.numeClient,
      telefonClient: values.telefonClient
    });
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    toast.success("Programare creată.");
    setNpOpen(false);
    form.reset();
    router.refresh();
  }

  const hasLogo = Boolean(logoUrl);
  const hasServicii = serviciiCount > 0;
  const hasSlug = Boolean(publicSlug);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="mb-6 shrink-0 rounded-lg border border-zinc-800 bg-zinc-900/90 p-4 text-sm">
        <div className="font-semibold text-zinc-200 mb-2">Checklist început</div>
        <ul className="space-y-2 text-zinc-400">
          <li className="flex items-center gap-2">
            {hasLogo ? <Check className="h-4 w-4 text-emerald-400 shrink-0" /> : <Circle className="h-4 w-4 text-zinc-600 shrink-0" />}
            <span>1. Adaugă logo în Setări</span>
          </li>
          <li className="flex items-center gap-2">
            {hasServicii ? <Check className="h-4 w-4 text-emerald-400 shrink-0" /> : <Circle className="h-4 w-4 text-zinc-600 shrink-0" />}
            <span>2. Verifică serviciile</span>
          </li>
          <li className="flex items-center gap-2">
            {hasSlug ? <Check className="h-4 w-4 text-emerald-400 shrink-0" /> : <Circle className="h-4 w-4 text-zinc-600 shrink-0" />}
            <span>3. Copiază linkul public din sidebar</span>
          </li>
        </ul>
      </div>

      <div className="flex-1 min-h-0">{children}</div>

      <Dialog open={npOpen} onOpenChange={setNpOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Programare nouă</DialogTitle>
            <DialogDescription className="text-zinc-400">Scurtătură tasta N. Oră în fusul tău local al dispozitivului.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="serviciuId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviciu</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <option value="">Alege serviciul</option>
                        {servicii.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nume} ({s.durata_minute} min)
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataStartLocal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data și ora</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" className="border-zinc-700 bg-zinc-900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numeClient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nume client</FormLabel>
                    <FormControl>
                      <Input className="border-zinc-700 bg-zinc-900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefonClient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input className="border-zinc-700 bg-zinc-900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" className="border-zinc-700" onClick={() => setNpOpen(false)}>
                  Renunță
                </Button>
                <Button type="submit" className="bg-[#1d4ed8] hover:bg-[#1e40af]">
                  Salvează
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
