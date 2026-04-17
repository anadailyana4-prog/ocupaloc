"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trackAuthEvent, trackSignup } from "@/lib/analytics";
import { parseClientsCSV } from "@/lib/csv-import";
import { slugifyBusinessName } from "@/lib/slug";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { bootstrapTenantAfterSignup } from "./actions";

type ServiceDraft = {
  nume: string;
  pret: string;
  durata: string;
};

type WorkDay = {
  key: "luni" | "marti" | "miercuri" | "joi" | "vineri" | "sambata" | "duminica";
  label: string;
  active: boolean;
  start: string;
  end: string;
};

const ACTIVITATI = [
  "Consultanță / Coaching",
  "Clinică / Medical",
  "Sport / Fitness",
  "Educație / Cursuri",
  "Auto / Service",
  "Frizerie/Barber",
  "Manichiură/Pedichiură",
  "Salon înfrumusețare",
  "Cosmetică",
  "Masaj",
  "Coafor",
  "Altele"
] as const;

type Activitate = (typeof ACTIVITATI)[number];

const DEFAULT_DAYS: WorkDay[] = [
  { key: "luni", label: "Luni", active: true, start: "09:00", end: "18:00" },
  { key: "marti", label: "Marți", active: true, start: "09:00", end: "18:00" },
  { key: "miercuri", label: "Miercuri", active: true, start: "09:00", end: "18:00" },
  { key: "joi", label: "Joi", active: true, start: "09:00", end: "18:00" },
  { key: "vineri", label: "Vineri", active: true, start: "09:00", end: "18:00" },
  { key: "sambata", label: "Sâmbătă", active: false, start: "10:00", end: "16:00" },
  { key: "duminica", label: "Duminică", active: false, start: "10:00", end: "16:00" }
];

const EMPTY_SERVICES: ServiceDraft[] = [
  { nume: "", pret: "", durata: "30" },
  { nume: "", pret: "", durata: "45" },
  { nume: "", pret: "", durata: "60" }
];

function cloneDays(days: WorkDay[]): WorkDay[] {
  return days.map((day) => ({ ...day }));
}

function presetDays(start: string, end: string, weekendActive = false): WorkDay[] {
  return [
    { key: "luni", label: "Luni", active: true, start, end },
    { key: "marti", label: "Marți", active: true, start, end },
    { key: "miercuri", label: "Miercuri", active: true, start, end },
    { key: "joi", label: "Joi", active: true, start, end },
    { key: "vineri", label: "Vineri", active: true, start, end },
    { key: "sambata", label: "Sâmbătă", active: weekendActive, start: "10:00", end: "16:00" },
    { key: "duminica", label: "Duminică", active: false, start: "10:00", end: "16:00" }
  ];
}

const PRESET_SERVICES: Record<Activitate, ServiceDraft[]> = {
  "Consultanță / Coaching": [
    { nume: "Sesiune consultanță 30 min", pret: "150", durata: "30" },
    { nume: "Sesiune consultanță 60 min", pret: "250", durata: "60" },
    { nume: "Audit + plan acțiune", pret: "450", durata: "90" }
  ],
  "Clinică / Medical": [
    { nume: "Consultație inițială", pret: "220", durata: "45" },
    { nume: "Control periodic", pret: "180", durata: "30" },
    { nume: "Procedură", pret: "350", durata: "60" }
  ],
  "Sport / Fitness": [
    { nume: "Antrenament personal", pret: "170", durata: "60" },
    { nume: "Evaluare inițială", pret: "120", durata: "45" },
    { nume: "Program nutriție", pret: "220", durata: "60" }
  ],
  "Educație / Cursuri": [
    { nume: "Lecție individuală", pret: "120", durata: "60" },
    { nume: "Ședință recapitulare", pret: "90", durata: "45" },
    { nume: "Consultare plan de studiu", pret: "150", durata: "60" }
  ],
  "Auto / Service": [
    { nume: "Diagnoză", pret: "120", durata: "45" },
    { nume: "Revizie", pret: "320", durata: "90" },
    { nume: "Schimb consumabile", pret: "180", durata: "60" }
  ],
  "Frizerie/Barber": [
    { nume: "Tuns", pret: "80", durata: "45" },
    { nume: "Tuns + barbă", pret: "120", durata: "60" },
    { nume: "Aranjat barbă", pret: "50", durata: "30" }
  ],
  "Manichiură/Pedichiură": [
    { nume: "Manichiură", pret: "120", durata: "60" },
    { nume: "Pedichiură", pret: "140", durata: "60" },
    { nume: "Gel + întreținere", pret: "170", durata: "90" }
  ],
  "Salon înfrumusețare": [
    { nume: "Coafat", pret: "130", durata: "60" },
    { nume: "Tratament facial", pret: "220", durata: "75" },
    { nume: "Pachet premium", pret: "350", durata: "120" }
  ],
  "Cosmetică": [
    { nume: "Curățare facială", pret: "180", durata: "60" },
    { nume: "Tratament anti-age", pret: "260", durata: "75" },
    { nume: "Consult cosmetic", pret: "120", durata: "45" }
  ],
  Masaj: [
    { nume: "Masaj relaxare", pret: "170", durata: "60" },
    { nume: "Masaj terapeutic", pret: "220", durata: "60" },
    { nume: "Masaj profund", pret: "300", durata: "90" }
  ],
  Coafor: [
    { nume: "Tuns + styling", pret: "130", durata: "60" },
    { nume: "Vopsit", pret: "320", durata: "120" },
    { nume: "Tratament păr", pret: "180", durata: "60" }
  ],
  Altele: [
    { nume: "Consultație", pret: "150", durata: "45" },
    { nume: "Sesiune standard", pret: "200", durata: "60" },
    { nume: "Serviciu extins", pret: "300", durata: "90" }
  ]
};

const PRESET_SCHEDULES: Record<Activitate, { days: WorkDay[]; weekend: boolean }> = {
  "Consultanță / Coaching": { days: presetDays("09:00", "18:00", false), weekend: false },
  "Clinică / Medical": { days: presetDays("08:00", "17:00", false), weekend: false },
  "Sport / Fitness": { days: presetDays("07:00", "21:00", true), weekend: true },
  "Educație / Cursuri": { days: presetDays("10:00", "20:00", true), weekend: true },
  "Auto / Service": { days: presetDays("08:00", "18:00", false), weekend: false },
  "Frizerie/Barber": { days: presetDays("10:00", "20:00", true), weekend: true },
  "Manichiură/Pedichiură": { days: presetDays("10:00", "19:00", true), weekend: true },
  "Salon înfrumusețare": { days: presetDays("10:00", "19:00", true), weekend: true },
  "Cosmetică": { days: presetDays("10:00", "19:00", true), weekend: true },
  Masaj: { days: presetDays("10:00", "20:00", true), weekend: true },
  Coafor: { days: presetDays("09:00", "19:00", true), weekend: true },
  Altele: { days: cloneDays(DEFAULT_DAYS), weekend: false }
};

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [csvOpen, setCsvOpen] = useState(false);
  const [activity, setActivity] = useState<Activitate>(ACTIVITATI[0]);
  const [businessName, setBusinessName] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [services, setServices] = useState<ServiceDraft[]>(EMPTY_SERVICES);
  const [workDays, setWorkDays] = useState<WorkDay[]>(DEFAULT_DAYS);
  const [workWeekend, setWorkWeekend] = useState(false);
  const [servicesTouched, setServicesTouched] = useState(false);
  const [scheduleTouched, setScheduleTouched] = useState(false);

  const progress = useMemo(() => (step / 3) * 100, [step]);

  useEffect(() => {
    trackSignup(step);
  }, [step]);

  useEffect(() => {
    if (!servicesTouched) {
      setServices(PRESET_SERVICES[activity].map((item) => ({ ...item })));
    }
    if (!scheduleTouched) {
      const preset = PRESET_SCHEDULES[activity];
      setWorkDays(cloneDays(preset.days));
      setWorkWeekend(preset.weekend);
    }
  }, [activity, servicesTouched, scheduleTouched]);

  function applyActivityTemplate() {
    setServicesTouched(false);
    setScheduleTouched(false);
    setServices(PRESET_SERVICES[activity].map((item) => ({ ...item })));
    const preset = PRESET_SCHEDULES[activity];
    setWorkDays(cloneDays(preset.days));
    setWorkWeekend(preset.weekend);
    toast.success("Template-ul pentru activitatea ta a fost aplicat.");
  }

  const updateService = (index: number, field: keyof ServiceDraft, value: string) => {
    setServicesTouched(true);
    setServices((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const updateDay = (index: number, field: "active" | "start" | "end", value: boolean | string) => {
    setScheduleTouched(true);
    setWorkDays((prev) =>
      prev.map((day, i) => {
        if (i !== index) return day;
        if (field === "active") return { ...day, active: Boolean(value) };
        return { ...day, [field]: String(value) };
      })
    );
  };

  const toggleWeekend = (checked: boolean) => {
    setScheduleTouched(true);
    setWorkWeekend(checked);
    setWorkDays((prev) =>
      prev.map((day) =>
        day.key === "sambata" || day.key === "duminica"
          ? { ...day, active: checked }
          : day
      )
    );
  };

  const nextStep = () => {
    if (step === 1 && (!businessName.trim() || !telefon.trim() || !email.trim())) {
      toast.error("Completează numele business-ului, telefonul și emailul.");
      return;
    }
    setStep((prev) => Math.min(3, prev + 1));
  };

  const previousStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const importCsvClients = async (file?: File) => {
    if (!file) return;
    try {
      const clients = await parseClientsCSV(file);
      setImportedCount(clients.length);
      toast.success(`${clients.length} clienți importați cu succes`);
      setCsvOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Importul CSV a eșuat.");
    }
  };

  async function onCreateAccount() {
    if (!businessName.trim() || !telefon.trim() || !email.trim()) {
      toast.error("Completează datele obligatorii din primul pas.");
      setStep(1);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = telefon.trim().replace(/\s+/g, " ");

    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const baseSlug = slugifyBusinessName(businessName);
    let slug = baseSlug;
    let suffix = 1;

    while (true) {
      const { data, error } = await supabase.rpc("is_slug_available", { slug_to_check: slug });
      if (error) {
        setIsSubmitting(false);
        toast.error("Nu am putut verifica slug-ul business-ului.");
        return;
      }
      if (data) break;
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const generatedPassword = `${crypto.randomUUID()}-Aa1!`;
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: generatedPassword,
      options: {
        data: {
          full_name: businessName,
          phone: cleanPhone,
          activity
        },
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=/dashboard` : undefined
      }
    });

    if (error || !data.user) {
      setIsSubmitting(false);
      toast.error(error?.message ?? "Nu am putut crea contul.");
      return;
    }

    if (data.session) {
      const boot = await bootstrapTenantAfterSignup({
        orgName: businessName,
        slug,
        activity,
        phone: cleanPhone,
        services,
        workDays
      });
      if (!boot.ok) {
        setIsSubmitting(false);
        toast.error(boot.error);
        return;
      }
    }

    localStorage.setItem("ocupaloc:lastSlug", slug);
    localStorage.setItem("ocupaloc:lastImportedClients", String(importedCount));
    localStorage.setItem("ocupaloc:onboardingServices", JSON.stringify(services));
    localStorage.setItem("ocupaloc:onboardingSchedule", JSON.stringify(workDays));
    trackAuthEvent("signup_success", "email_password");
    toast.success("Cont creat cu succes.");
    router.push("/onboarding/bun-venit");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-3xl border-zinc-800 bg-zinc-950">
        <CardHeader className="space-y-4">
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-zinc-400">Pasul {step} din 3</p>
          </div>
          <CardTitle>Creează cont Ocupaloc</CardTitle>
          <CardDescription>
            Setezi contul în 3 pași și poți începe să primești programări imediat.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 ? (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Despre business-ul tău</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tip activitate</label>
                  <select
                    value={activity}
                    onChange={(event) => setActivity(event.target.value as Activitate)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {ACTIVITATI.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nume business</label>
                  <Input
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    placeholder="Numele business-ului tău"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefon</label>
                  <Input value={telefon} onChange={(event) => setTelefon(event.target.value)} placeholder="07xx xxx xxx" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="contact@business.ro"
                  />
                </div>
              </div>

              <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
                <DialogTrigger asChild>
                  <button type="button" className="text-sm text-primary underline-offset-4 hover:underline">
                    Ai deja clienți în altă platformă sau Excel? Importă-i
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Importă clienți din CSV</DialogTitle>
                    <DialogDescription>Acceptăm coloane: nume/name, telefon/phone, email.</DialogDescription>
                  </DialogHeader>
                  <Input type="file" accept=".csv,text/csv" onChange={(event) => void importCsvClients(event.target.files?.[0])} />
                </DialogContent>
              </Dialog>

              {importedCount > 0 ? (
                <p className="text-sm font-medium text-emerald-400">{importedCount} clienți importați cu succes</p>
              ) : null}
            </section>
          ) : null}

          {step === 2 ? (
            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Primele tale servicii</h2>
                  <p className="text-sm text-muted-foreground">Template activ: {activity}</p>
                </div>
                <Button type="button" variant="outline" onClick={applyActivityTemplate}>
                  Reaplică template
                </Button>
              </div>
              <div className="space-y-3">
                {services.map((service, index) => (
                  <div key={`service-${index + 1}`} className="grid gap-2 rounded-lg border border-zinc-800 p-3 md:grid-cols-3">
                    <Input
                      placeholder={`Serviciu ${index + 1}`}
                      value={service.nume}
                      onChange={(event) => updateService(index, "nume", event.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Preț (RON)"
                      value={service.pret}
                      onChange={(event) => updateService(index, "pret", event.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Durată (minute)"
                      value={service.durata}
                      onChange={(event) => updateService(index, "durata", event.target.value)}
                    />
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setServices(EMPTY_SERVICES);
                  setStep(3);
                }}
              >
                Adaugă mai târziu
              </Button>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="space-y-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold">Program de lucru</h2>
                <p className="text-sm text-muted-foreground">Program recomandat automat pentru activitatea selectată.</p>
              </div>
              <div className="space-y-3">
                {workDays.map((day, index) => (
                  <div key={day.key} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-lg border border-zinc-800 p-3">
                    <Checkbox checked={day.active} onCheckedChange={(checked) => updateDay(index, "active", checked === true)} />
                    <p className="text-sm font-medium">{day.label}</p>
                    <Input
                      type="time"
                      className="w-28"
                      value={day.start}
                      disabled={!day.active}
                      onChange={(event) => updateDay(index, "start", event.target.value)}
                    />
                    <Input
                      type="time"
                      className="w-28"
                      value={day.end}
                      disabled={!day.active}
                      onChange={(event) => updateDay(index, "end", event.target.value)}
                    />
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox checked={workWeekend} onCheckedChange={(checked) => toggleWeekend(checked === true)} />
                Lucrez și weekend
              </label>
            </section>
          ) : null}
        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t border-zinc-800 pt-6">
          <div className="flex w-full items-center justify-between">
            <Button type="button" variant="ghost" onClick={previousStep} disabled={step === 1}>
              Înapoi
            </Button>
            {step < 3 ? (
              <Button type="button" onClick={nextStep}>
                Continuă
              </Button>
            ) : (
              <Button type="button" disabled={isSubmitting} onClick={() => void onCreateAccount()}>
                {isSubmitting ? "Se creează contul..." : "Creează cont gratuit"}
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Ai deja cont?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Intră în cont
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
