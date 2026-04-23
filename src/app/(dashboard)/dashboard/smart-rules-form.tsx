"use client";

import { useState, useTransition } from "react";
import { updateSmartRules } from "./actions";

type Props = {
  enabled: boolean;
  maxFutureBookings: number;
  minNoticeMinutes: number;
  clientCancelThreshold: number;
  cancelWindowDays: number;
};

function minutesToLabel(min: number): string {
  if (min === 0) return "rezervări imediate permise";
  if (min < 60) return `${min} minute înainte`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h} ${h === 1 ? "oră" : "ore"} înainte`;
  return `${h}h ${m}min înainte`;
}

export function SmartRulesForm({ enabled, maxFutureBookings, minNoticeMinutes, clientCancelThreshold, cancelWindowDays }: Props) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [maxFuture, setMaxFuture] = useState(maxFutureBookings);
  const [notice, setNotice] = useState(minNoticeMinutes);
  const [threshold, setThreshold] = useState(clientCancelThreshold);
  const [window, setWindow] = useState(cancelWindowDays);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      await updateSmartRules(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <section className="lux-card space-y-6 p-6">
      {/* Header + master toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-wide text-amber-100">Reguli smart</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Protejează-ți agenda împotriva rezervărilor abuzive sau de ultim moment.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          onClick={() => setIsEnabled((v) => !v)}
          className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 ${
            isEnabled ? "bg-amber-300" : "bg-zinc-700"
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${
              isEnabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
          <span className="sr-only">{isEnabled ? "Dezactivează" : "Activează"} reguli smart</span>
        </button>
      </div>

      {/* Disabled state */}
      {!isEnabled && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 text-sm text-zinc-400">
          Regulile sunt <span className="font-medium text-zinc-300">inactive</span>. Orice client poate rezerva fără restricții.
          Activează comutatorul de mai sus pentru a configura protecțiile.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="smart_rules_enabled" value={isEnabled ? "on" : "off"} />

        {/* Rule cards — only shown when enabled */}
        <div className={`space-y-3 transition-opacity duration-200 ${isEnabled ? "opacity-100" : "pointer-events-none opacity-30"}`}>

          {/* Rule 1: min notice */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 text-2xl leading-none" aria-hidden>⏱</span>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="font-medium text-zinc-100">Preaviz minim la rezervare</p>
                  <p className="mt-0.5 text-sm text-zinc-400">
                    Clientul poate rezerva cu cel puțin{" "}
                    <span className="font-semibold text-amber-200">{minutesToLabel(notice)}</span>.
                    Prevenă rezervările de ultim moment când nu mai ai timp să te pregătești.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="smart_min_notice_minutes"
                    name="smart_min_notice_minutes"
                    type="number"
                    min={0}
                    max={1440}
                    value={notice}
                    onChange={(e) => setNotice(Math.max(0, Math.min(1440, Number(e.target.value))))}
                    disabled={!isEnabled}
                    className="w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-amber-300 focus:outline-none"
                  />
                  <span className="text-sm text-zinc-400">minute <span className="text-zinc-600">(0 = imediat)</span></span>
                </div>
                {notice > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {[30, 60, 120, 240].map((m) => (
                      <button
                        key={m}
                        type="button"
                        disabled={!isEnabled}
                        onClick={() => setNotice(m)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          notice === m
                            ? "bg-amber-300 text-slate-900"
                            : "border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                        }`}
                      >
                        {minutesToLabel(m)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rule 2: max future bookings */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 text-2xl leading-none" aria-hidden>📅</span>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="font-medium text-zinc-100">Maxim programări active per client</p>
                  <p className="mt-0.5 text-sm text-zinc-400">
                    {maxFuture === 0
                      ? "Nicio limită — un client poate ocupa oricâte locuri în avans."
                      : <>Un client poate avea maxim{" "}
                          <span className="font-semibold text-amber-200">{maxFuture} programare{maxFuture !== 1 ? "i" : ""} activă{maxFuture !== 1 ? "" : ""}</span>
                          {" "}în același timp. Eliberează locuri pentru alți clienți.</>
                    }
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="smart_max_future_bookings"
                    name="smart_max_future_bookings"
                    type="number"
                    min={0}
                    max={10}
                    value={maxFuture}
                    onChange={(e) => setMaxFuture(Math.max(0, Math.min(10, Number(e.target.value))))}
                    disabled={!isEnabled}
                    className="w-20 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-amber-300 focus:outline-none"
                  />
                  <span className="text-sm text-zinc-400">programări <span className="text-zinc-600">(0 = fără limită)</span></span>
                </div>
                {maxFuture > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        type="button"
                        disabled={!isEnabled}
                        onClick={() => setMaxFuture(n)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          maxFuture === n
                            ? "bg-amber-300 text-slate-900"
                            : "border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                        }`}
                      >
                        max {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rule 3: cancel abuse */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 text-2xl leading-none" aria-hidden>🚫</span>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="font-medium text-zinc-100">Blocare după anulări repetate</p>
                  <p className="mt-0.5 text-sm text-zinc-400">
                    {threshold === 0
                      ? "Dezactivat — clienții pot anula de oricâte ori fără consecințe."
                      : <>Dacă un client anulează de{" "}
                          <span className="font-semibold text-amber-200">{threshold} ori</span>{" "}
                          în ultimele{" "}
                          <span className="font-semibold text-amber-200">{window} zile</span>
                          , nu mai poate rezerva online. Îl poți suna direct.</>
                    }
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label htmlFor="smart_client_cancel_threshold" className="text-xs text-zinc-500">Anulări permise</label>
                    <div className="flex items-center gap-2">
                      <input
                        id="smart_client_cancel_threshold"
                        name="smart_client_cancel_threshold"
                        type="number"
                        min={0}
                        max={10}
                        value={threshold}
                        onChange={(e) => setThreshold(Math.max(0, Math.min(10, Number(e.target.value))))}
                        disabled={!isEnabled}
                        className="w-20 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-amber-300 focus:outline-none"
                      />
                      <span className="text-xs text-zinc-500">anulări <span className="text-zinc-600">(0 = dezactivat)</span></span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="smart_cancel_window_days" className="text-xs text-zinc-500">Fereastra de analiză</label>
                    <div className="flex items-center gap-2">
                      <input
                        id="smart_cancel_window_days"
                        name="smart_cancel_window_days"
                        type="number"
                        min={7}
                        max={365}
                        value={window}
                        onChange={(e) => setWindow(Math.max(7, Math.min(365, Number(e.target.value))))}
                        disabled={!isEnabled || threshold === 0}
                        className="w-20 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-amber-300 focus:outline-none disabled:opacity-40"
                      />
                      <span className="text-xs text-zinc-500">zile</span>
                    </div>
                  </div>
                </div>
                {threshold > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {[{ t: 2, w: 30 }, { t: 3, w: 60 }, { t: 5, w: 90 }].map(({ t, w: wv }) => (
                      <button
                        key={`${t}-${wv}`}
                        type="button"
                        disabled={!isEnabled}
                        onClick={() => { setThreshold(t); setWindow(wv); }}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          threshold === t && window === wv
                            ? "bg-amber-300 text-slate-900"
                            : "border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                        }`}
                      >
                        {t}× în {wv}z
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full border-0 bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:brightness-105 disabled:opacity-50"
          >
            {isPending ? "Se salvează..." : "Salvează"}
          </button>
          {saved && <span className="text-sm text-emerald-400">✓ Salvat</span>}
        </div>
      </form>
    </section>
  );
}
