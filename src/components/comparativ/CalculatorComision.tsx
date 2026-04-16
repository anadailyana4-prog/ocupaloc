"use client";

import { useMemo, useState } from "react";

import { MONTHLY_PRICE_LEI } from "@/config/marketing";

const OCUPALOC_PRICE = MONTHLY_PRICE_LEI;
const COMMISSION_PER_BOOKING = 10;

function formatRon(value: number): string {
  return new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(Math.max(0, value));
}

export function CalculatorComision() {
  const [appointments, setAppointments] = useState(100);

  const saving = useMemo(() => {
    return appointments * COMMISSION_PER_BOOKING - OCUPALOC_PRICE;
  }, [appointments]);

  return (
    <section className="rounded-2xl border border-emerald-700/40 bg-emerald-950/20 p-6">
      <h2 className="text-2xl font-bold">Calculator economii</h2>
      <p className="mt-3 text-zinc-200">
        Introdu câte programări ai pe lună și vezi cât economisești vs platformele cu comision
      </p>
      <div className="mt-4 max-w-sm space-y-3">
        <label className="block text-sm text-zinc-300" htmlFor="appointments">
          Număr programări / lună
        </label>
        <input
          id="appointments"
          type="number"
          min={0}
          value={appointments}
          onChange={(event) => setAppointments(Number(event.target.value) || 0)}
          className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-zinc-100"
        />
      </div>
      <p className="mt-5 text-lg font-semibold text-emerald-300">Economisești {formatRon(saving)} RON/lună</p>
    </section>
  );
}

