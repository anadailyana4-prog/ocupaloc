"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Props = {
  slug: string | null;
  profileDone: boolean;
  serviciiCount: number;
  programSetat: boolean;
};

const SHARED_KEY = "link_shared";

type Check = {
  id: "profile" | "service" | "schedule" | "share";
  label: string;
  done: boolean;
  href: string | null;
};

export function ActivationWidgets({ slug, profileDone, serviciiCount, programSetat }: Props) {
  const [copied, setCopied] = useState(false);
  const [linkShared, setLinkShared] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SHARED_KEY) === "true";
  });

  const publicUrl = slug ? `https://ocupaloc.ro/${slug}` : null;

  const checks = useMemo<Check[]>(
    () => [
      {
        id: "profile",
        label: "Completează profilul",
        done: profileDone,
        href: "/dashboard/pagina"
      },
      {
        id: "service",
        label: "Adaugă primul serviciu",
        done: serviciiCount > 0,
        href: "/dashboard/servicii"
      },
      {
        id: "schedule",
        label: "Setează programul",
        done: programSetat,
        href: "/dashboard/program"
      },
      {
        id: "share",
        label: "Distribuie linkul",
        done: linkShared,
        href: null
      }
    ],
    [profileDone, serviciiCount, programSetat, linkShared]
  );

  const completedCount = checks.filter((check) => check.done).length;
  const activationScore = Math.round((completedCount / checks.length) * 100);
  const nextAction = checks.find((check) => !check.done) ?? null;

  async function handleCopy() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SHARED_KEY, "true");
    }
    setLinkShared(true);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function markShared() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SHARED_KEY, "true");
    }
    setLinkShared(true);
  }

  return (
    <>
      <div className="mb-8 rounded-2xl border border-amber-200/15 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/60 p-6 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {publicUrl ? (
            <>
              <div className="flex-1">
                <h2 className="mb-2 text-xl font-semibold">Linkul tău de programare</h2>
                <p className="mb-3 text-sm text-slate-200">Distribuie linkul pe canalele tale și începe să primești programări direct.</p>
                <div className="flex items-center gap-2 rounded-lg border border-amber-200/15 bg-white/5 p-3 backdrop-blur">
                  <code className="flex-1 text-sm font-mono">{publicUrl}</code>
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="rounded-md bg-amber-200 px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:bg-amber-100"
                  >
                    {copied ? "Copiat!" : "Copiază"}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Programează-te online: ${publicUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={markShared}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-emerald-400"
                >
                  <span>WhatsApp</span>
                </a>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-amber-200/20 bg-white/10 px-4 py-2.5 font-medium backdrop-blur transition hover:bg-white/20"
                >
                  Vezi pagina
                </a>
              </div>
            </>
          ) : (
            <div className="w-full space-y-3">
              <h2 className="text-xl font-semibold">Linkul tău de programare</h2>
              <p className="text-sm text-slate-200">Completează profilul pentru a activa linkul.</p>
              <Link
                href="/dashboard/pagina"
                className="inline-flex rounded-lg bg-amber-200 px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-amber-100"
              >
                Configurează pagina
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-amber-200/15 bg-slate-950/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Scor activare cont</h3>
          <span className="text-sm text-amber-100/70">{activationScore}%</span>
        </div>

        <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-cyan-300" style={{ width: `${activationScore}%` }} />
        </div>

        {nextAction ? (
          <div className="mb-5 rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-sm">
            <p className="font-medium text-cyan-100">Următorul pas recomandat</p>
            <p className="mt-1 text-cyan-100/80">{nextAction.label}</p>
          </div>
        ) : null}

        <div className="space-y-3">
          {checks.map((check) => (
            <div key={check.id} className="flex items-center gap-3">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${check.done ? "bg-emerald-500 text-slate-900" : "bg-slate-700"}`}>
                {check.done ? "✓" : null}
              </div>
              <span className={check.done ? "text-slate-400 line-through" : "text-slate-100"}>{check.label}</span>
              {!check.done && check.href ? (
                <Link href={check.href} className="ml-auto text-sm text-cyan-300 hover:underline">
                  Completează →
                </Link>
              ) : null}
            </div>
          ))}
        </div>

        {completedCount === 4 ? (
          <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
            <p className="font-medium text-emerald-300">Gata! Ești live. Trimite linkul la primii 3 clienți.</p>
          </div>
        ) : null}
      </div>
    </>
  );
}
