"use client";

import { useEffect, useState } from "react";

type HealthResponse = {
  ok: boolean;
  checks: {
    db: boolean;
    bookings: boolean;
    resendConfigured: boolean;
    remindersSecretConfigured: boolean;
    bookingConfirmationSecretConfigured: boolean;
  };
  latencyMs: number;
  timestamp: string;
  dbError: string | null;
};

function formatCheckLabel(key: keyof HealthResponse["checks"]) {
  const labels: Record<keyof HealthResponse["checks"], string> = {
    db: "Conectivitate bază de date",
    bookings: "Acces tabel programări",
    resendConfigured: "Email tranzacțional configurat",
    remindersSecretConfigured: "Secret remindere configurat",
    bookingConfirmationSecretConfigured: "Secret confirmare/anulare configurat"
  };

  return labels[key];
}

export default function StatusPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const response = await fetch("/api/health", { cache: "no-store" });
        const payload = (await response.json()) as HealthResponse;
        if (!active) return;
        setData(payload);
        setError(response.ok ? null : payload.dbError || "Unul sau mai multe servicii sunt degradate.");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Nu am putut verifica starea sistemului.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-14 text-zinc-100">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl shadow-black/20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/80">Status</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Starea sistemului OcupaLoc</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">
            Pagina aceasta arată verificările tehnice de bază pentru serviciile esențiale ale platformei: accesul la baza de date, programări și secretele necesare fluxurilor operaționale.
          </p>
        </header>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Stare curentă</p>
              <div className="mt-2 flex items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    data?.ok ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {loading ? "Verificăm..." : data?.ok ? "Operațional" : "Degradat"}
                </span>
                {data?.latencyMs ? <span className="text-sm text-zinc-400">Latenta health check: {data.latencyMs} ms</span> : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              Reîncarcă verificarea
            </button>
          </div>

          {error ? <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{error}</p> : null}
          {data?.timestamp ? <p className="mt-4 text-sm text-zinc-500">Ultima verificare: {new Date(data.timestamp).toLocaleString("ro-RO")}</p> : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {data
            ? (Object.entries(data.checks) as [keyof HealthResponse["checks"], boolean][]).map(([key, value]) => (
                <article key={key} className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-50">{formatCheckLabel(key)}</h2>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {value
                          ? "Verificarea a trecut cu succes la ultima execuție a endpoint-ului de health."
                          : "Verificarea nu a trecut. Este nevoie de investigație înainte de a considera sistemul complet sănătos."}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${value ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                      {value ? "OK" : "Probleme"}
                    </span>
                  </div>
                </article>
              ))
            : Array.from({ length: 5 }).map((_, index) => (
                <article key={index} className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
                  <div className="h-5 w-40 animate-pulse rounded bg-zinc-800" />
                  <div className="mt-4 h-4 w-full animate-pulse rounded bg-zinc-900" />
                  <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-zinc-900" />
                </article>
              ))}
        </section>
      </div>
    </main>
  );
}