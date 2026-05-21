"use client";

import { addDays, format } from "date-fns";
import { ro } from "date-fns/locale";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

const SERVICES = [
  { id: "tuns", name: "Tuns", minutes: 45, price: 80 },
  { id: "vopsit", name: "Vopsit", minutes: 120, price: 200 },
  { id: "mani", name: "Manichiură", minutes: 60, price: 90 }
];

function buildDemoSlotsForToday(): string[] {
  const now = new Date();
  const slots: string[] = [];
  for (let h = 10; h <= 17; h++) {
    if (h === 13) continue;
    const d = new Date(now);
    d.setHours(h, 0, 0, 0);
    slots.push(format(d, "HH:mm"));
  }
  return slots;
}

export function DemoMarketingClient() {
  const [svcId, setSvcId] = useState(SERVICES[0].id);
  const svc = SERVICES.find((s) => s.id === svcId) ?? SERVICES[0];
  const today = useMemo(() => new Date(), []);
  const nextDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, i)), [today]);
  const slots = useMemo(() => buildDemoSlotsForToday(), []);
  const [slotPick] = useState(slots[2] ?? slots[0] ?? "14:00");

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border oc-border bg-white p-5 shadow-sm md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b oc-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide oc-accent">Exemplu public · Studio Beauty</p>
          <h2 className="mt-1 font-display text-2xl font-bold oc-text">Studio Beauty</h2>
          <p className="text-sm oc-secondary-text">București · programări online cu OcupaLoc</p>
        </div>
        <span className="rounded-full border oc-border bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          Demo vizual
        </span>
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <p className="text-xs font-medium oc-secondary-text">1. Serviciu</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SERVICES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSvcId(s.id)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                  svcId === s.id ? "border-oc-primary bg-oc-primary/10 font-semibold oc-text" : "oc-border bg-white oc-text"
                }`}
              >
                {s.name}
                <span className="block text-xs font-normal oc-secondary-text">
                  {s.minutes} min · {s.price} RON
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium oc-secondary-text">2. Următoarele zile (exemplu pentru data curentă)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {nextDays.map((d, i) => (
              <span
                key={d.toISOString()}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  i === 0 ? "border-oc-primary bg-oc-primary/15 font-semibold" : "oc-border bg-zinc-50 oc-text"
                }`}
              >
                {format(d, "EEE d MMM", { locale: ro })}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium oc-secondary-text">3. Ore disponibile (azi)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {slots.map((t) => (
              <span
                key={t}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  t === slotPick ? "border-oc-primary bg-oc-primary/15 font-semibold" : "oc-border bg-zinc-50"
                }`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-oc-amber/20 bg-oc-amber-soft/50 p-4 text-sm text-oc-slate">
          <p className="font-semibold">Rezumat demo</p>
          <p className="mt-1">
            {svc.name} · {format(today, "EEEE, d MMMM", { locale: ro })} · {slotPick}
          </p>
          <p className="mt-2 text-xs">Acest flux este ilustrativ. În contul tău real, rezervările intră în dashboard.</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t oc-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg font-semibold oc-text">Vrei și tu așa?</p>
          <p className="text-sm oc-secondary-text">14 zile gratuite, apoi 59,99 RON/lună — fără comision per programare.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="oc-primary">
            <Link href="/signup?start=1">Creează cont gratuit</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/demo-interactiv">Demo interactiv personalizat</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
