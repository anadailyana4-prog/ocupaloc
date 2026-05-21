"use client";

import { useEffect, useState } from "react";

type HealthResponse = {
  ok: boolean;
  latencyMs: number;
  timestamp: string;
};

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
        setError(response.ok ? null : "Unul sau mai multe servicii sunt degradate.");
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
    <main className="min-h-screen oc-bg px-6 py-14 oc-text">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="rounded-3xl border oc-border bg-white p-8 shadow-[0_20px_45px_-30px_rgba(15,118,110,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] oc-accent">Status</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Starea sistemului OcupaLoc</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 oc-secondary-text md:text-lg">
            Pagina aceasta arată verificările tehnice de bază pentru serviciile esențiale ale platformei: accesul la baza de date, programări și secretele necesare fluxurilor operaționale.
          </p>
        </header>

        <section className="rounded-3xl border oc-border bg-white p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] oc-secondary-text">Stare curentă</p>
              <div className="mt-2 flex items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    data?.ok ? "bg-emerald-100 text-emerald-700" : "bg-oc-amber-soft text-oc-warning"
                  }`}
                >
                  {loading ? "Verificăm..." : data?.ok ? "Operațional" : "Degradat"}
                </span>
                {data?.latencyMs ? <span className="text-sm oc-secondary-text">Latenta health check: {data.latencyMs} ms</span> : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex rounded-full border oc-border bg-white px-4 py-2 text-sm font-medium oc-text transition hover:oc-badge-bg"
            >
              Reîncarcă verificarea
            </button>
          </div>

          {error ? <p className="mt-4 rounded-2xl border border-oc-amber/30 bg-oc-amber-soft px-4 py-3 text-sm text-oc-warning">{error}</p> : null}
          {data?.timestamp ? <p className="mt-4 text-sm oc-secondary-text">Ultima verificare: {new Date(data.timestamp).toLocaleString("ro-RO")}</p> : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border oc-border bg-white p-6 md:col-span-2">
            <h2 className="text-lg font-semibold oc-text">Sănătate serviciu (public)</h2>
            <p className="mt-2 text-sm leading-6 oc-secondary-text">
              Endpoint-ul public afișează doar starea minimă a serviciului. Detaliile tehnice extinse sunt disponibile doar intern prin endpoint-ul protejat de health detailed.
            </p>
            {loading ? <div className="mt-4 h-4 w-40 animate-pulse rounded oc-badge-bg" /> : null}
          </article>
        </section>
      </div>
    </main>
  );
}