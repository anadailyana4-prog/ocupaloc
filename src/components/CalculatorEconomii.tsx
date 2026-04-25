"use client";

import { useMemo, useState } from "react";

import { Slider } from "@/components/ui/slider";
import { trackCalculator } from "@/lib/analytics";

const OCUPALOC_PRICE = 59.99;
const PLATFORM_COMMISSION_RON = 10;

function formatRon(value: number): string {
  return new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export function CalculatorEconomii() {
  const [bookings, setBookings] = useState(60);

  const platformCost = useMemo(() => bookings * PLATFORM_COMMISSION_RON, [bookings]);
  const economieLunara = useMemo(() => Math.max(0, platformCost - OCUPALOC_PRICE), [platformCost]);
  const economieAnuala = useMemo(() => economieLunara * 12, [economieLunara]);
  const maxBar = Math.max(platformCost, OCUPALOC_PRICE);

  return (
    <section className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Calculează cât economisești față de platformele cu comision</h2>
        <p className="text-sm text-zinc-400">Câte programări faci pe lună? <span className="font-semibold text-zinc-100">{bookings}</span></p>
      </div>

      <Slider
        min={10}
        max={300}
        step={1}
        value={[bookings]}
        onValueChange={(value) => {
          const nextValue = value[0] ?? 60;
          setBookings(nextValue);
          trackCalculator(nextValue);
        }}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-sm text-zinc-400">Platformă cu comision</p>
          <p className="mt-1 text-2xl font-bold">{formatRon(platformCost)} RON/lună</p>
          <p className="text-xs text-zinc-500">Comision mediu / programare</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-sm text-zinc-400">OcupaLoc</p>
          <p className="mt-1 text-2xl font-bold">59,99 RON/lună</p>
          <p className="text-xs text-zinc-500">Preț fix, fără comisioane</p>
        </div>
        <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/30 p-4">
          <p className="text-sm text-emerald-300">Economie</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{formatRon(economieLunara)} RON/lună</p>
          <p className="text-xs text-emerald-200">{formatRon(economieAnuala)} RON/an</p>
        </div>
      </div>

      <p className="font-bold">La {bookings} programări/lună economisești {formatRon(economieAnuala)} RON pe an</p>

      <div className="space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
            <span>Platformă cu comision</span>
            <span>{formatRon(platformCost)} RON</span>
          </div>
          <div className="h-3 w-full rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-rose-500" style={{ width: `${(platformCost / maxBar) * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
            <span>OcupaLoc</span>
            <span>59,99 RON</span>
          </div>
          <div className="h-3 w-full rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(OCUPALOC_PRICE / maxBar) * 100}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
