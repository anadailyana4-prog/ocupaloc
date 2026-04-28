"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trackAuthEvent, trackOnboardingEvent, trackSignup } from "@/lib/analytics";
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

const SIGNUP_STEP_STORAGE_KEY = "ocupaloc:signupStep";
const SIGNUP_EMAIL_STORAGE_KEY = "ocupaloc:signupEmail";
const SIGNUP_NAME_STORAGE_KEY = "ocupaloc:signupName";

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
  { nume: "", pret: "", durata: "" },
  { nume: "", pret: "", durata: "" },
  { nume: "", pret: "", durata: "" }
];

const SERVICE_EXAMPLES: ServiceDraft[] = [
  { nume: "Manichiură", pret: "120", durata: "60" },
  { nume: "Pedichiură", pret: "140", durata: "60" },
  { nume: "Gel + întreținere", pret: "170", durata: "90" }
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
  return (
    <Suspense>
      <SignupPageContent />
    </Suspense>
  );
}

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [csvOpen, setCsvOpen] = useState(false);
  const [activity, setActivity] = useState<Activitate>(ACTIVITATI[0]);
  const [businessName, setBusinessName] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [services, setServices] = useState<ServiceDraft[]>(EMPTY_SERVICES);
  const [workDays, setWorkDays] = useState<WorkDay[]>(DEFAULT_DAYS);
  const [workWeekend, setWorkWeekend] = useState(false);
  const [scheduleTouched, setScheduleTouched] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const progress = useMemo(() => (step / 3) * 100, [step]);

  useEffect(() => {
    trackSignup(step);
    trackOnboardingEvent("onboarding_signup_view", {
      step,
      page: "/signup"
    });
  }, [step]);

  useEffect(() => {
    if (searchParams.get("start") === "1") {
      localStorage.removeItem(SIGNUP_STEP_STORAGE_KEY);
      localStorage.removeItem(SIGNUP_EMAIL_STORAGE_KEY);
      localStorage.removeItem(SIGNUP_NAME_STORAGE_KEY);
      setStep(1);
      return;
    }

    if (typeof window === "undefined") return;
    const savedStep = Number(localStorage.getItem(SIGNUP_STEP_STORAGE_KEY));
    const savedEmail = localStorage.getItem(SIGNUP_EMAIL_STORAGE_KEY) ?? "";
    const savedName = localStorage.getItem(SIGNUP_NAME_STORAGE_KEY) ?? "";
    const hasFormData = savedEmail.trim().length > 0 && savedName.trim().length > 0;
    // Only restore step 2 or 3 if user previously filled step 1 fields
    if (Number.isInteger(savedStep) && savedStep >= 1 && (savedStep === 1 || hasFormData)) {
      setStep(savedStep);
      if (savedName) setBusinessName(savedName);
      if (savedEmail) setEmail(savedEmail);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SIGNUP_STEP_STORAGE_KEY, String(step));
  }, [step]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (businessName) localStorage.setItem(SIGNUP_NAME_STORAGE_KEY, businessName);
  }, [businessName]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (email) localStorage.setItem(SIGNUP_EMAIL_STORAGE_KEY, email);
  }, [email]);

  useEffect(() => {
    if (!scheduleTouched) {
      const preset = PRESET_SCHEDULES[activity];
      setWorkDays(cloneDays(preset.days));
      setWorkWeekend(preset.weekend);
    }
  }, [activity, scheduleTouched]);

  const updateService = (index: number, field: keyof ServiceDraft, value: string) => {
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
    if (step === 1 && (!businessName.trim() || !telefon.trim() || !email.trim() || !password.trim())) {
      toast.error("Completează numele business-ului, telefonul, emailul și parola.");
      return;
    }
    if (step === 1 && password.trim().length < 8) {
      toast.error("Parola trebuie să aibă cel puțin 8 caractere.");
      return;
    }
    trackOnboardingEvent("onboarding_step_completed", {
      step,
      page: "/signup"
    });
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
    if (!businessName.trim() || !telefon.trim() || !email.trim() || !password.trim()) {
      toast.error("Completează datele obligatorii din primul pas, inclusiv parola.");
      setStep(1);
      return;
    }

    if (password.trim().length < 8) {
      toast.error("Parola trebuie să aibă cel puțin 8 caractere.");
      setStep(1);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = telefon.trim().replace(/\s+/g, " ");
    const siteUrl =
      (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const baseSlug = slugifyBusinessName(businessName);
    let slug = baseSlug;
    let suffix = 1;

    while (true) {
      const { data, error } = await supabase.rpc("is_slug_available", { slug_to_check: slug });
      if (error) {
        // Do not block signup on transient RPC issues.
        // The server bootstrap flow also handles slug conflicts safely.
        break;
      }
      if (data) break;
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: businessName,
          phone: cleanPhone,
          activity
        },
        emailRedirectTo: siteUrl ? `${siteUrl}/auth/callback?signup=1&next=/login` : undefined
      }
    });

    const recoverableSignupError = (() => {
      if (!error) return false;
      const text = `${error.message ?? ""} ${(error as { status?: number }).status ?? ""}`.toLowerCase();
      return (
        text.includes("servicii_tenant_id_fkey") ||
        text.includes("insert or update on table \"servicii\"") ||
        text.includes("foreign key") ||
        text.includes("constraint") ||
        text.includes("database error saving new user") ||
        text.includes("insert or update")
      );
    })();

    let signupUser = data.user;

    // Supabase can return a "fake success" for existing emails (anti-enumeration).
    // In this case, user.identities is empty and no confirmation email is sent.
    const looksLikeExistingUserWithoutNewSignup =
      !error &&
      !!data.user &&
      Array.isArray((data.user as { identities?: unknown[] }).identities) &&
      ((data.user as { identities?: unknown[] }).identities?.length ?? 0) === 0;

    if (looksLikeExistingUserWithoutNewSignup) {
      setIsSubmitting(false);
      toast.error("Emailul este deja înregistrat. Intră în cont sau folosește resetarea parolei.");
      router.push("/login");
      return;
    }

    if (!signupUser && recoverableSignupError) {
      // Some DB triggers can return a post-insert FK error even though Auth user was created.
      // Try to recover by signing in with the credentials just created.
      const recovered = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (!recovered.error && recovered.data.user) {
        signupUser = recovered.data.user;
      }
    }

    if (error && !recoverableSignupError) {
      const failedToSendEmail = (error.message ?? "").toLowerCase().includes("error sending confirmation email");
      if (failedToSendEmail) {
        const fallbackResponse = await fetch("/api/auth/signup-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            password,
            fullName: businessName,
            phone: cleanPhone,
            activity,
            redirectTo: siteUrl ? `${siteUrl}/auth/callback?signup=1&next=/login` : undefined
          })
        });

        const fallbackPayload = (await fallbackResponse.json().catch(() => null)) as
          | { message?: string; code?: string }
          | null;

        if (fallbackResponse.status === 409 || fallbackPayload?.code === "already_registered") {
          setIsSubmitting(false);
          toast.error("Emailul este deja înregistrat. Intră în cont cu parola sau folosește resetarea parolei.");
          router.push("/login");
          return;
        }

        if (fallbackResponse.ok) {
          setIsSubmitting(false);
          setEmailSent(true);
          return;
        }

        setIsSubmitting(false);
        toast.error(fallbackPayload?.message ?? "Nu am putut trimite emailul de confirmare.");
        return;
      }

      const errorText = (error?.message ?? "").toLowerCase();
      const alreadyRegistered = errorText.includes("already registered") || errorText.includes("already exists");
      if (alreadyRegistered) {
        setIsSubmitting(false);

        toast.error("Emailul este deja înregistrat. Intră în cont cu parola sau folosește resetarea parolei.");
        router.push("/login");
        return;
      }
      setIsSubmitting(false);
      toast.error(error?.message ?? "Nu am putut crea contul.");
      return;
    }

    if (!signupUser && !recoverableSignupError) {
      setIsSubmitting(false);
      toast.error("Nu am putut crea contul.");
      return;
    }

    // IMPORTANT: do not run server bootstrap in signup flow.
    // Any transient DB/FK issue here would block onboarding UX.
    // Initial setup is handled safely after login from dashboard actions.

    localStorage.setItem("ocupaloc:lastSlug", slug);
    localStorage.removeItem(SIGNUP_STEP_STORAGE_KEY);
    localStorage.removeItem(SIGNUP_EMAIL_STORAGE_KEY);
    localStorage.removeItem(SIGNUP_NAME_STORAGE_KEY);
    localStorage.setItem("ocupaloc:lastImportedClients", String(importedCount));
    localStorage.setItem("ocupaloc:onboardingServices", JSON.stringify(services));
    localStorage.setItem("ocupaloc:onboardingSchedule", JSON.stringify(workDays));
    trackOnboardingEvent("onboarding_activation", {
      step: 3,
      page: "/signup",
      imported_clients: importedCount,
      activity
    });
    trackAuthEvent("signup_success", "email_password");
    setIsSubmitting(false);
    setEmailSent(true);
  }

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-950 text-center">
          <CardHeader className="space-y-4 pb-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950 text-4xl">
              📧
            </div>
            <CardTitle className="text-2xl">Verificați emailul</CardTitle>
            <CardDescription className="text-base text-zinc-300">
              Vă vom trimite un email de confirmare la adresa{" "}
              <span className="font-semibold text-white">{email}</span>.
              <br />
              <span className="mt-2 block text-sm text-zinc-400">
                Accesați linkul din email pentru a activa contul.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="rounded-md border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
              Nu ați primit emailul? Verificați și folderul{" "}
              <span className="font-medium text-zinc-300">Spam / Junk</span>.
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/login" className="text-sm text-zinc-400 underline underline-offset-2 hover:text-white">
              Mergi la autentificare
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
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
          <CardTitle>Creează cont OcupaLoc</CardTitle>
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
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Parolă</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Minim 8 caractere"
                      autoComplete="new-password"
                      className="pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 px-2 text-zinc-400 hover:text-zinc-100"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
                    >
                      {showPassword ? "👁" : "🙈"}
                    </Button>
                  </div>
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
              <h2 className="text-xl font-semibold">Serviciile tale</h2>
              <div className="space-y-3">
                <div className="grid gap-2 px-3 md:grid-cols-3">
                  <p className="text-xs font-medium text-zinc-400">Serviciul oferit</p>
                  <p className="text-xs font-medium text-zinc-400">Timp de execuție (min)</p>
                  <p className="text-xs font-medium text-zinc-400">Prețul (RON)</p>
                </div>
                {services.map((service, index) => (
                  <div key={`service-${index + 1}`} className="grid gap-2 rounded-lg border border-zinc-800 p-3 md:grid-cols-3">
                    <Input
                      placeholder={SERVICE_EXAMPLES[index]?.nume ?? "ex: Serviciu"}
                      value={service.nume}
                      onChange={(event) => updateService(index, "nume", event.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder={SERVICE_EXAMPLES[index]?.durata ?? "ex: 60"}
                      value={service.durata}
                      onChange={(event) => updateService(index, "durata", event.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder={SERVICE_EXAMPLES[index]?.pret ?? "ex: 120"}
                      value={service.pret}
                      onChange={(event) => updateService(index, "pret", event.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setServices((prev) => [...prev, { nume: "", pret: "", durata: "" }]);
                  }}
                >
                  Adaugă alte servicii
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStep(3);
                  }}
                >
                  Amintește-mi mai târziu
                </Button>
              </div>
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
            {step === 1 ? (
              <Button type="button" variant="ghost" onClick={() => router.push("/")}>
                Înapoi
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={previousStep}>
                Înapoi
              </Button>
            )}
            {step < 3 ? (
              <Button type="button" onClick={nextStep} className="px-6 text-base font-extrabold tracking-wide">
                Continuă
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => void onCreateAccount()}
                className="px-6 text-base font-extrabold tracking-wide"
              >
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
