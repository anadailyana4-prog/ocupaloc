"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Props = {
  slug: string | null;
  profileDone: boolean;
  serviciiCount: number;
  programSetat: boolean;
  /** ISO string – used for 14-day habit panel */
  accountCreatedAt?: string | null;
  /** Total confirmed bookings ever – used to decide if habit panel shows */
  confirmedBookingsCount?: number;
  /** Show a one-time first-booking celebration banner */
  showFirstBookingCelebration?: boolean;
};

const SHARED_KEY = "link_shared";

type Check = {
  id: "profile" | "service" | "schedule" | "share";
  label: string;
  done: boolean;
  href: string | null;
};

export function ActivationWidgets({
  slug,
  profileDone,
  serviciiCount,
  programSetat,
  accountCreatedAt,
  confirmedBookingsCount = 0,
  showFirstBookingCelebration = false
}: Props) {
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
  const allDone = completedCount === checks.length;
  const activationScore = Math.round((completedCount / checks.length) * 100);
  const nextAction = checks.find((check) => !check.done) ?? null;

  // Post-activation habit panel: show for first 14 days when fully set up but no bookings yet
  const accountAgeDays =
    accountCreatedAt
      ? Math.floor((Date.now() - new Date(accountCreatedAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;
  const showHabitPanel =
    allDone && confirmedBookingsCount === 0 && accountAgeDays !== null && accountAgeDays <= 14;

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
      <div className="mb-8 rounded-2xl border oc-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {publicUrl ? (
            <>
              <div className="flex-1">
                <h2 className="mb-2 text-xl font-semibold oc-accent">Linkul tău de programare</h2>
                <p className="mb-3 text-sm oc-secondary-text">
                  Distribuie linkul pe canalele tale și începe să primești programări direct.
                </p>
                <div className="flex items-center gap-2 rounded-lg border oc-border bg-oc-teal-soft p-3">
                  <code className="flex-1 font-mono text-sm oc-text">{publicUrl}</code>
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="rounded-md bg-oc-amber px-3 py-1.5 text-sm font-medium text-white transition hover:bg-oc-amber-light"
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
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-500"
                >
                  <span>WhatsApp</span>
                </a>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border oc-border bg-white px-4 py-2.5 font-medium oc-text transition hover:bg-oc-teal-soft"
                >
                  Vezi pagina
                </a>
              </div>
            </>
          ) : (
            <div className="w-full space-y-3">
              <h2 className="text-xl font-semibold oc-accent">Linkul tău de programare</h2>
              <p className="text-sm oc-secondary-text">Completează profilul pentru a activa linkul.</p>
              <Link
                href="/dashboard/pagina"
                className="inline-flex rounded-lg bg-oc-amber px-4 py-2.5 text-sm font-medium text-white transition hover:bg-oc-amber-light"
              >
                Configurează pagina
              </Link>
            </div>
          )}
        </div>
      </div>

      {!allDone ? (
        <div className="mb-8 rounded-2xl border border-oc-amber-soft bg-oc-amber-soft/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Scor activare cont</h3>
            <span className="text-sm oc-secondary-text">{activationScore}%</span>
          </div>

          <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-oc-amber to-oc-teal"
              style={{ width: `${activationScore}%` }}
            />
          </div>

          {nextAction ? (
            <div className="mb-5 rounded-xl border border-oc-teal/20 bg-oc-teal-soft p-3 text-sm">
              <p className="font-medium oc-accent">Următorul pas recomandat</p>
              <p className="mt-1 oc-secondary-text">{nextAction.label}</p>
            </div>
          ) : null}

          <div className="space-y-3">
            {checks.map((check) => (
              <div key={check.id} className="flex items-center gap-3">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    check.done ? "bg-emerald-500 text-white" : "border border-[#E2E8F0] bg-white"
                  }`}
                >
                  {check.done ? "✓" : null}
                </div>
                <span className={check.done ? "oc-secondary-text line-through" : "oc-text"}>
                  {check.label}
                </span>
                {!check.done && check.href ? (
                  <Link href={check.href} className="ml-auto text-sm oc-accent hover:underline">
                    Completează →
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {showFirstBookingCelebration ? (
        <div className="mb-8 rounded-2xl border border-emerald-300 bg-emerald-50 p-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🎉</span>
            <div>
              <h3 className="text-lg font-semibold text-emerald-900">Prima programare confirmată!</h3>
              <p className="mt-1 text-sm text-emerald-800">
                Felicitări — produsul funcționează. Primul client te-a ales. Continuă să trimiți linkul și urmărește agenda cum se umple.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {showHabitPanel ? (
        <div className="mb-8 rounded-2xl border border-oc-teal/20 bg-oc-teal-soft p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🚀</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold oc-accent">Ești gata — trimite linkul azi!</h3>
              <p className="mt-1 text-sm oc-secondary-text">
                Profilul e complet. Acum e momentul să aduci primii clienți. Cel mai des, prima
                programare vine în primele 24h după ce trimiți linkul.
              </p>
              {accountAgeDays !== null ? (
                <p className="mt-2 text-xs oc-secondary-text">Ziua {accountAgeDays + 1} din 14 de la creare</p>
              ) : null}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border oc-border bg-white p-3 text-sm shadow-sm">
                  <p className="font-semibold oc-text">1. WhatsApp</p>
                  <p className="mt-1 text-xs oc-secondary-text">
                    Trimite linkul la minim 10 clienți existenți din telefon
                  </p>
                  {publicUrl ? (
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Programează-te online la noi: ${publicUrl}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={markShared}
                      className="mt-2 inline-block rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                    >
                      Deschide WhatsApp →
                    </a>
                  ) : null}
                </div>
                <div className="rounded-xl border oc-border bg-white p-3 text-sm shadow-sm">
                  <p className="font-semibold oc-text">2. Story Instagram</p>
                  <p className="mt-1 text-xs oc-secondary-text">
                    Postează linkul în story cu &ldquo;Rezervă acum online&rdquo;
                  </p>
                  {publicUrl ? (
                    <button
                      type="button"
                      onClick={() =>
                        void (async () => {
                          await navigator.clipboard.writeText(publicUrl);
                        })()
                      }
                      className="mt-2 inline-block rounded-full bg-oc-teal px-3 py-1 text-xs font-medium text-white hover:bg-oc-teal-dark"
                    >
                      Copiază linkul
                    </button>
                  ) : null}
                </div>
                <div className="rounded-xl border oc-border bg-white p-3 text-sm shadow-sm">
                  <p className="font-semibold oc-text">3. Semn fizic</p>
                  <p className="mt-1 text-xs oc-secondary-text">
                    Pune QR-ul la recepție sau pe chitanță
                  </p>
                  {publicUrl ? (
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block rounded-full border oc-border bg-white px-3 py-1 text-xs font-medium oc-text hover:bg-oc-teal-soft"
                    >
                      Pagina mea →
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
