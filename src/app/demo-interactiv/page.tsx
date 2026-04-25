"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trackDemoCreated } from "@/lib/analytics";

import { createDemo } from "./actions";

const BUSINESS_TYPES = ["Frizerie", "Salon", "Manichiură", "Cosmetică", "Barber"] as const;
const CITIES = ["București", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Brașov", "Sibiu", "Oradea", "Craiova"] as const;
const NAME_REGEX = /^[a-zA-Z0-9ăâîșțĂÂÎȘȚ\s\-]{3,40}$/;

const SERVICES_BY_TYPE: Record<(typeof BUSINESS_TYPES)[number], string[]> = {
  Frizerie: ["Tuns bărbați 60 RON", "Tuns + barbă 90 RON", "Spălat + aranjat 40 RON"],
  Salon: ["Tuns + coafat 120 RON", "Vopsit rădăcină 180 RON", "Tratament păr 150 RON"],
  "Manichiură": ["Manichiură clasică 80 RON", "Gel 120 RON", "Întreținere 90 RON"],
  "Cosmetică": ["Curățare ten 150 RON", "Tratament facial 200 RON", "Pensat + vopsit 70 RON"],
  Barber: ["Fade 80 RON", "Tuns + barbă premium 120 RON", "Contur barbă 50 RON"]
};

export default function DemoInteractivPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessType, setBusinessType] = useState<(typeof BUSINESS_TYPES)[number]>("Frizerie");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState<(typeof CITIES)[number]>("București");
  const [services, setServices] = useState<string[]>(SERVICES_BY_TYPE.Frizerie.slice(0, 3));

  const serviceOptions = useMemo(() => SERVICES_BY_TYPE[businessType], [businessType]);

  const setServiceAt = (index: number, value: string) => {
    setServices((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const validateStep2 = () => {
    if (businessName.length > 40) {
      toast.error("Numele business-ului poate avea maxim 40 caractere.");
      return false;
    }
    if (!NAME_REGEX.test(businessName)) {
      toast.error("Numele business-ului trebuie să aibă 3-40 caractere și doar litere/cifre/spații/cratimă.");
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (step === 2 && !validateStep2()) return;
    if (step < 3) setStep((prev) => prev + 1);
  };

  const goBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const onSubmit = async () => {
    if (!validateStep2()) {
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    const result = await createDemo({
      businessName,
      businessType,
      city,
      services
    });

    if (!result.ok) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    trackDemoCreated(businessType);
    router.push(`/demo/${result.id}`);
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
      <Card className="mx-auto w-full max-w-2xl border-zinc-800 bg-zinc-900/60">
        <CardHeader>
          <CardTitle>Demo interactiv OcupaLoc</CardTitle>
          <CardDescription>Configurează un demo în 3 pași. Link valabil 24 de ore.</CardDescription>
          <p className="text-xs text-zinc-400">Pasul {step} din 3</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 ? (
            <div className="space-y-3">
              <label className="text-sm font-medium">Tip business</label>
              <select
                value={businessType}
                onChange={(event) => {
                  const nextType = event.target.value as (typeof BUSINESS_TYPES)[number];
                  setBusinessType(nextType);
                  setServices(SERVICES_BY_TYPE[nextType].slice(0, 3));
                }}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {BUSINESS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Nume business</label>
                <Input
                  value={businessName}
                  maxLength={40}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder="Ex: Studio Urban"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Oraș</label>
                <select
                  value={city}
                  onChange={(event) => setCity(event.target.value as (typeof CITIES)[number])}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {CITIES.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-300">Selectează 3 servicii pentru demo (doar din lista predefinită):</p>
              {[0, 1, 2].map((index) => (
                <div key={`service-${index + 1}`} className="space-y-2">
                  <label className="text-sm font-medium">Serviciu {index + 1}</label>
                  <select
                    value={services[index]}
                    onChange={(event) => setServiceAt(index, event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {serviceOptions.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="ghost" onClick={goBack} disabled={step === 1 || isSubmitting}>
              Înapoi
            </Button>
            {step < 3 ? (
              <Button type="button" onClick={goNext}>
                Continuă
              </Button>
            ) : (
              <Button type="button" onClick={() => void onSubmit()} disabled={isSubmitting}>
                {isSubmitting ? "Se creează demo..." : "Generează demo"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

