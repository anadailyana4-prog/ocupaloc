"quot;use client"quot;;

import Link from "quot;next/link"quot;;
import { useMemo, useState } from "quot;react"quot;;

type Props = {
  slug: string | null;
  profileDone: boolean;
  serviciiCount: number;
  programSetat: boolean;
  /** ISO string – used for 14-day habit panel */
  accountCreatedAt?: string | null;
  /** Total confirmed bookings ever – used to decide if habit panel shows */
  confirmedBookingsCount?: number;
};

const SHARED_KEY = "quot;link_shared"quot;;

type Check = {
  id: "quot;profile"quot; | "quot;service"quot; | "quot;schedule"quot; | "quot;share"quot;;
  label: string;
  done: boolean;
  href: string | null;
};

export function ActivationWidgets({ slug, profileDone, serviciiCount, programSetat, accountCreatedAt, confirmedBookingsCount = 0 }: Props) {
  const [copied, setCopied] = useState(false);
  const [linkShared, setLinkShared] = useState<boolean>(() => {
    if (typeof window === "quot;undefined"quot;) return false;
    return window.localStorage.getItem(SHARED_KEY) === "quot;true"quot;;
  });

  const publicUrl = slug ? `https://ocupaloc.ro/${slug}` : null;

  const checks = useMemo<Check[]>(
    () => [
      {
        id: "quot;profile"quot;,
        label: "quot;Completează profilul"quot;,
        done: profileDone,
        href: "quot;/dashboard/pagina"quot;
      },
      {
        id: "quot;service"quot;,
        label: "quot;Adaugă primul serviciu"quot;,
        done: serviciiCount > 0,
        href: "quot;/dashboard/servicii"quot;
      },
      {
        id: "quot;schedule"quot;,
        label: "quot;Setează programul"quot;,
        done: programSetat,
        href: "quot;/dashboard/program"quot;
      },
      {
        id: "quot;share"quot;,
        label: "quot;Distribuie linkul"quot;,
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

  // Post-activation habit panel: show for first 14 days after account creation when fully set up but no bookings yet
  const accountAgeDays = accountCreatedAt
    ? Math.floor((Date.now() - new Date(accountCreatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const showHabitPanel = allDone && confirmedBookingsCount === 0 && accountAgeDays !== null && accountAgeDays <= 14;

  async function handleCopy() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    if (typeof window !== "quot;undefined"quot;) {
      window.localStorage.setItem(SHARED_KEY, "quot;true"quot;);
    }
    setLinkShared(true);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function markShared() {
    if (typeof window !== "quot;undefined"quot;) {
      window.localStorage.setItem(SHARED_KEY, "quot;true"quot;);
    }
    setLinkShared(true);
  }

  return (
    <>
      <div className="quot;mb-8 rounded-2xl border border-amber-200/15 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/60 p-6 text-white"quot;>
        <div className="quot;flex flex-col gap-4 md:flex-row md:items-center md:justify-between"quot;>
          {publicUrl ? (
            <>
              <div className="quot;flex-1"quot;>
                <h2 className="quot;mb-2 text-xl font-semibold"quot;>Linkul tău de programare</h2>
                <p className="quot;mb-3 text-sm text-slate-200"quot;>Distribuie linkul pe canalele tale și începe să primești programări direct.</p>
                <div className="quot;flex items-center gap-2 rounded-lg border border-amber-200/15 bg-white/5 p-3 backdrop-blur"quot;>
                  <code className="quot;flex-1 text-sm font-mono"quot;>{publicUrl}</code>
                  <button
                    type="quot;button"quot;
                    onClick={() => void handleCopy()}
                    className="quot;rounded-md bg-amber-200 px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:bg-amber-100"quot;
                  >
                    {copied ? "quot;Copiat!"quot; : "quot;Copiază"quot;}
                  </button>
                </div>
              </div>
              <div className="quot;flex gap-2"quot;>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Programează-te online: ${publicUrl}`)}`}
                  target="quot;_blank"quot;
                  rel="quot;noreferrer"quot;
                  onClick={markShared}
                  className="quot;flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-emerald-400"quot;
                >
                  <span>WhatsApp</span>
                </a>
                <a
                  href={publicUrl}
                  target="quot;_blank"quot;
                  rel="quot;noreferrer"quot;
                  className="quot;rounded-lg border border-amber-200/20 bg-white/10 px-4 py-2.5 font-medium backdrop-blur transition hover:bg-white/20"quot;
                >
                  Vezi pagina
                </a>
              </div>
            </>
          ) : (
            <div className="quot;w-full space-y-3"quot;>
              <h2 className="quot;text-xl font-semibold"quot;>Linkul tău de programare</h2>
              <p className="quot;text-sm text-slate-200"quot;>Completează profilul pentru a activa linkul.</p>
              <Link
                href="quot;/dashboard/pagina"quot;
                className="quot;inline-flex rounded-lg bg-amber-200 px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-amber-100"quot;
              >
                Configurează pagina
              </Link>
            </div>
          )}
        </div>
      </div>

      {!allDone ? (
        <div className="quot;mb-8 rounded-2xl border border-amber-200/15 bg-slate-950/50 p-6"quot;>
          <div className="quot;mb-4 flex items-center justify-between"quot;>
            <h3 className="quot;text-lg font-semibold"quot;>Scor activare cont</h3>
            <span className="quot;text-sm text-amber-100/70"quot;>{activationScore}%</span>
          </div>

          <div className="quot;mb-5 h-2 w-full overflow-hidden rounded-full bg-slate-800"quot;>
            <div className="quot;h-full rounded-full bg-gradient-to-r from-amber-300 to-cyan-300"quot; style={{ width: `${activationScore}%` }} />
          </div>

          {nextAction ? (
            <div className="quot;mb-5 rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-sm"quot;>
              <p className="quot;font-medium text-cyan-100"quot;>Următorul pas recomandat</p>
              <p className="quot;mt-1 text-cyan-100/80"quot;>{nextAction.label}</p>
            </div>
          ) : null}

          <div className="quot;space-y-3"quot;>
            {checks.map((check) => (
              <div key={check.id} className="quot;flex items-center gap-3"quot;>
                <div className={`flex h-5 w-5 items-center justify-center rounded-full ${check.done ? "quot;bg-emerald-500 text-slate-900"quot; : "quot;bg-slate-700"quot;}`}>
                  {check.done ? "quot;✓"quot; : null}
                </div>
                <span className={check.done ? "quot;text-slate-400 line-through"quot; : "quot;text-slate-100"quot;}>{check.label}</span>
                {!check.done && check.href ? (
                  <Link href={check.href} className="quot;ml-auto text-sm text-cyan-300 hover:underline"quot;>
                    Completează →
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {showHabitPanel ? (
        <div className="quot;mb-8 rounded-2xl border border-violet-400/20 bg-violet-950/30 p-6"quot;>
          <div className="quot;flex items-start gap-3"quot;>
            <span className="quot;text-2xl"quot;>🚀</span>
            <div className="quot;flex-1"quot;>
              <h3 className="quot;text-lg font-semibold text-violet-100"quot;>Ești gata — trimite linkul azi!</h3>
              <p className="quot;mt-1 text-sm text-violet-100/70"quot;>
                Profilul e complet. Acum e momentul să aduci primii clienți. Cele mai multe saloane primesc prima programare în primele 24h după ce trimit linkul.
              </p>
              {accountAgeDays !== null ? (
                <p className="quot;mt-2 text-xs text-violet-100/50"quot;>Ziua {accountAgeDays + 1} din 14 de la creare</p>
              ) : null}
              <div className="quot;mt-4 grid gap-3 sm:grid-cols-3"quot;>
                <div className="quot;rounded-xl border border-violet-400/15 bg-violet-900/30 p-3 text-sm"quot;>
                  <p className="quot;font-semibold text-violet-100"quot;>1. WhatsApp</p>
                  <p className="quot;mt-1 text-violet-100/60 text-xs"quot;>Trimite linkul la minim 10 clienți existenți din telefon</p>
                  {publicUrl ? (
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Programează-te online la noi: ${publicUrl}`)}`}
                      target="quot;_blank"quot;
                      rel="quot;noreferrer"quot;
                      onClick={markShared}
                      className="quot;mt-2 inline-block rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-slate-900 hover:bg-emerald-400"quot;
                    >
                      Deschide WhatsApp →
                    </a>
                  ) : null}
                </div>
                <div className="quot;rounded-xl border border-violet-400/15 bg-violet-900/30 p-3 text-sm"quot;>
                  <p className="quot;font-semibold text-violet-100"quot;>2. Story Instagram</p>
                  <p className="quot;mt-1 text-violet-100/60 text-xs"quot;>Postează linkul în story cu „Rezervă acum online"quot;</p>
                  {publicUrl ? (
                    <button
                      type="quot;button"quot;
                      onClick={() => void (async () => { await navigator.clipboard.writeText(publicUrl); })()}
                      className="quot;mt-2 inline-block rounded-full bg-violet-500 px-3 py-1 text-xs font-medium text-white hover:bg-violet-400"quot;
                    >
                      Copiază linkul
                    </button>
                  ) : null}
                </div>
                <div className="quot;rounded-xl border border-violet-400/15 bg-violet-900/30 p-3 text-sm"quot;>
                  <p className="quot;font-semibold text-violet-100"quot;>3. Semn fizic</p>
                  <p className="quot;mt-1 text-violet-100/60 text-xs"quot;>Pune QR-ul la salon sau pe chitanță</p>
                  {publicUrl ? (
                    <Link
                      href="quot;/dashboard/pagina"quot;
                      className="quot;mt-2 inline-block rounded-full bg-slate-700 px-3 py-1 text-xs font-medium text-white hover:bg-slate-600"quot;
                    >
                      Pagina mea →
                    </Link>
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
