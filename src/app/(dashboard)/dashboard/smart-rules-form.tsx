"use client";

import { useState, useTransition } from "react";
import { saveSmartRulesFromClient } from "./actions";

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

export function SmartRulesForm({
  enabled,
  maxFutureBookings,
  minNoticeMinutes,
  clientCancelThreshold,
  cancelWindowDays,
}: Props) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [maxFuture, setMaxFuture] = useState(maxFutureBookings);
  const [notice, setNotice] = useState(minNoticeMinutes);
  const [threshold, setThreshold] = useState(clientCancelThreshold);
  const [windowDays, setWindowDays] = useState(cancelWindowDays);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    startTransition(async () => {
      const res = await saveSmartRulesFromClient({
        smart_rules_enabled: isEnabled,
        smart_max_future_bookings: maxFuture,
        smart_min_notice_minutes: notice,
        smart_client_cancel_threshold: threshold,
        smart_cancel_window_days: windowDays,
      });
      if (res.ok) {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setErrorMsg(res.message);
        setStatus("error");
      }
    });
  }

  return (
    <section className="lux-card space-y-6 p-6">
      {/* Header + master toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="dash-page-title">Reguli smart</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Protejează-ți agenda împotriva rezervărilor de ultim moment sau abuzive.
          </p>
        </div>

        {/* Toggle switch — proper pill style */}
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          onClick={() => setIsEnabled((v) => !v)}
          className={`relative mt-1 inline-flex h-7 w-[52px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
            isEnabled ? "bg-oc-amber" : "bg-oc-border"
          }`}
        >
          <span
            aria-hidden
            className={`pointer-events-none inline-block h-5 w-5 translate-y-[1px] rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
              isEnabled ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
          <span className="sr-only">{isEnabled ? "Dezactivează" : "Activează"} reguli smart</span>
        </button>
      </div>

      {/* Disabled state notice */}
      {!isEnabled && (
        <div className="rounded-xl border oc-border bg-white bg-white/60 px-5 py-4 text-sm oc-secondary-text">
          Regulile sunt <span className="font-medium oc-secondary-text">inactive</span>. Orice client poate rezerva fără restricții.
          Activează comutatorul de mai sus pentru a configura protecțiile.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rule cards */}
        <div className={`space-y-3 transition-opacity duration-200 ${isEnabled ? "opacity-100" : "pointer-events-none opacity-30"}`}>

          {/* Rule 1: min notice */}
          <div className="rounded-xl border oc-border bg-white bg-white p-5">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 shrink-0 text-2xl leading-none" aria-hidden>⏱</span>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="font-medium oc-text">Preaviz minim la rezervare</p>
                  <p className="mt-0.5 text-sm oc-secondary-text">
                    Clientul poate rezerva cu cel puțin{" "}
                    <span className="font-semibold text-oc-amber">{minutesToLabel(notice)}</span>.
                    {" "}Previne rezervările de ultim moment.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={1440}
                    value={notice}
                    onChange={(e) => setNotice(Math.max(0, Math.min(1440, Number(e.target.value))))}
                    disabled={!isEnabled}
                    className="w-24 rounded-lg border dash-input px-3 py-2 text-sm oc-text focus:border-oc-teal focus:outline-none"
                  />
                  <span className="text-sm oc-secondary-text">minute <span className="oc-secondary-text">(0 = imediat)</span></span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 30, 60, 120, 240].map((m) => (
                    <button
                      key={m}
                      type="button"
                      disabled={!isEnabled}
                      onClick={() => setNotice(m)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        notice === m
                          ? "bg-oc-amber text-white"
                          : "border border-zinc-700 oc-secondary-text hover:border-oc-teal/40 hover:oc-accent"
                      }`}
                    >
                      {m === 0 ? "Imediat" : minutesToLabel(m)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Rule 2: max future bookings */}
          <div className="rounded-xl border oc-border bg-white bg-white p-5">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 shrink-0 text-2xl leading-none" aria-hidden>📅</span>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="font-medium oc-text">Maxim programări active per client</p>
                  <p className="mt-0.5 text-sm oc-secondary-text">
                    {maxFuture === 0
                      ? "Nicio limită — un client poate ocupa oricâte locuri în avans."
                      : <>Un client poate avea maxim{" "}
                          <span className="font-semibold text-oc-amber">{maxFuture} programare{maxFuture !== 1 ? "i active" : " activă"}</span>{" "}
                          în același timp.</>
                    }
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={maxFuture}
                    onChange={(e) => setMaxFuture(Math.max(0, Math.min(10, Number(e.target.value))))}
                    disabled={!isEnabled}
                    className="w-20 rounded-lg border dash-input px-3 py-2 text-sm oc-text focus:border-oc-teal focus:outline-none"
                  />
                  <span className="text-sm oc-secondary-text">programări <span className="oc-secondary-text">(0 = fără limită)</span></span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 1, 2, 3].map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={!isEnabled}
                      onClick={() => setMaxFuture(n)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        maxFuture === n
                          ? "bg-oc-amber text-white"
                          : "border border-zinc-700 oc-secondary-text hover:border-oc-teal/40 hover:oc-accent"
                      }`}
                    >
                      {n === 0 ? "Fără limită" : `Max ${n}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Rule 3: cancel abuse */}
          <div className="rounded-xl border oc-border bg-white bg-white p-5">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 shrink-0 text-2xl leading-none" aria-hidden>🚫</span>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="font-medium oc-text">Blocare după anulări repetate</p>
                  <p className="mt-0.5 text-sm oc-secondary-text">
                    {threshold === 0
                      ? "Dezactivat — clienții pot anula de oricâte ori fără consecințe."
                      : <>Dacă un client anulează de{" "}
                          <span className="font-semibold text-oc-amber">{threshold} ori</span>{" "}
                          în ultimele{" "}
                          <span className="font-semibold text-oc-amber">{windowDays} zile</span>
                          , nu mai poate rezerva online.</>
                    }
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <p className="text-xs oc-secondary-text">Anulări permise</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={threshold}
                        onChange={(e) => setThreshold(Math.max(0, Math.min(10, Number(e.target.value))))}
                        disabled={!isEnabled}
                        className="w-20 rounded-lg border dash-input px-3 py-2 text-sm oc-text focus:border-oc-teal focus:outline-none"
                      />
                      <span className="text-xs oc-secondary-text">anulări <span className="oc-secondary-text">(0 = off)</span></span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs oc-secondary-text">Fereastră de analiză</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={7}
                        max={365}
                        value={windowDays}
                        onChange={(e) => setWindowDays(Math.max(7, Math.min(365, Number(e.target.value))))}
                        disabled={!isEnabled || threshold === 0}
                        className="w-20 rounded-lg border dash-input px-3 py-2 text-sm oc-text focus:border-oc-amber focus:outline-none disabled:opacity-40"
                      />
                      <span className="text-xs oc-secondary-text">zile</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Off", t: 0, w: 60 },
                    { label: "2× / 30z", t: 2, w: 30 },
                    { label: "3× / 60z", t: 3, w: 60 },
                    { label: "5× / 90z", t: 5, w: 90 },
                  ].map(({ label, t, w }) => (
                    <button
                      key={label}
                      type="button"
                      disabled={!isEnabled}
                      onClick={() => { setThreshold(t); setWindowDays(w); }}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        threshold === t && (t === 0 || windowDays === w)
                          ? "bg-oc-amber text-white"
                          : "border border-zinc-700 oc-secondary-text hover:border-oc-teal/40 hover:oc-accent"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={status === "saving"}
            className="rounded-full bg-gradient-to-r from-oc-amber-light to-oc-amber px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
          >
            {status === "saving" ? "Se salvează…" : "Salvează"}
          </button>
          {status === "saved" && <span className="text-sm text-emerald-400">✓ Salvat</span>}
          {status === "error" && <span className="text-sm text-red-400">{errorMsg || "Eroare la salvare."}</span>}
        </div>
      </form>
    </section>
  );
}
