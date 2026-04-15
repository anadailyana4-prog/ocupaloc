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
        href: "/onboarding"
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
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {publicUrl ? (
            <>
              <div className="flex-1">
                <h2 className="mb-2 text-xl font-semibold">🔗 Linkul tău de programare</h2>
                <p className="mb-3 text-sm text-violet-100">Pune asta în bio Instagram, WhatsApp, Facebook</p>
                <div className="flex items-center gap-2 rounded-lg bg-white/10 p-3 backdrop-blur">
                  <code className="flex-1 text-sm font-mono">{publicUrl}</code>
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-violet-600 transition hover:bg-violet-50"
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
                  className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 font-medium transition hover:bg-green-600"
                >
                  <span>WhatsApp</span>
                </a>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-white/20 px-4 py-2.5 font-medium backdrop-blur transition hover:bg-white/30"
                >
                  Vezi pagina
                </a>
              </div>
            </>
          ) : (
            <div className="w-full space-y-3">
              <h2 className="text-xl font-semibold">🔗 Linkul tău de programare</h2>
              <p className="text-sm text-violet-100">Completează profilul pentru a activa linkul.</p>
              <Link
                href="/onboarding"
                className="inline-flex rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-violet-600 transition hover:bg-violet-50"
              >
                Mergi la onboarding
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">🚀 Primul tău client în 15 minute</h3>
          <span className="text-sm text-gray-400">{completedCount}/4 completați</span>
        </div>

        <div className="space-y-3">
          {checks.map((check) => (
            <div key={check.id} className="flex items-center gap-3">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${check.done ? "bg-green-500" : "bg-gray-700"}`}>
                {check.done ? "✓" : null}
              </div>
              <span className={check.done ? "text-gray-400 line-through" : "text-white"}>{check.label}</span>
              {!check.done && check.href ? (
                <Link href={check.href} className="ml-auto text-sm text-violet-400 hover:underline">
                  Completează →
                </Link>
              ) : null}
            </div>
          ))}
        </div>

        {completedCount === 4 ? (
          <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-center">
            <p className="font-medium text-green-400">🎉 Gata! Ești live. Trimite linkul la primii 3 clienți.</p>
          </div>
        ) : null}
      </div>
    </>
  );
}
