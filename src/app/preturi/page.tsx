import type { Metadata } from "next";
import Link from "next/link";

import { CalculatorEconomii } from "@/components/CalculatorEconomii";
import { getUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "59,99 RON/lună pentru saloane beauty",
  description:
    "59,99 RON pe lună, fără comisioane ascunse. Vezi cât economisești față de platformele cu comision și compară OcupaLoc cu alternativele."
};

const comparisonRows = [
  { feature: "Preț lunar", ocupaloc: "59,99 RON", standard: "Variabil", premium: "Variabil" },
  { feature: "Comision per programare", ocupaloc: "0 RON", standard: "Da", premium: "Da" },
  { feature: "Suport în română", ocupaloc: "Da", standard: "Limitat", premium: "Da" },
  { feature: "Fără reclame", ocupaloc: "Da", standard: "Nu", premium: "Nu" },
  { feature: "Import clienți gratuit", ocupaloc: "Da", standard: "Limitat", premium: "Limitat" },
  { feature: "Personalizare completă", ocupaloc: "Da", standard: "Parțial", premium: "Parțial" },
  { feature: "Plată în RON", ocupaloc: "Da", standard: "Nu", premium: "Da" }
] as const;

export default async function PreturiPage() {
  const user = await getUser();

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-14 text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">59,99 RON pe lună. Atât.</h1>
          <p className="text-lg text-zinc-400">Fără comisioane ascunse. Fără taxă per programare.</p>
        </header>

        <section className="mx-auto max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-sm uppercase tracking-wide text-zinc-400">Plan unic OcupaLoc</p>
          <p className="mt-3 text-5xl font-black">
            59,99 <span className="text-xl font-medium text-zinc-400">RON/lună</span>
          </p>
          <ul className="mt-6 space-y-2 text-left text-sm text-zinc-300">
            <li>✓ Programări nelimitate</li>
            <li>✓ Zero comision per programare</li>
            <li>✓ Link personalizat de rezervare</li>
            <li>✓ Import clienți gratuit</li>
            <li>✓ Suport rapid în limba română</li>
          </ul>
          {user ? (
            <Link href="/api/billing/create-checkout" data-cta-location="preturi_hero_card" className="mt-6 inline-flex rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500">
              Activează abonamentul
            </Link>
          ) : (
            <Link href="/signup" data-cta-location="preturi_hero_card" className="mt-6 inline-flex rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500">
              Încearcă 14 zile gratis
            </Link>
          )}
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">Trial clar</p>
            <h2 className="mt-3 text-xl font-semibold text-zinc-100">14 zile ca să vezi produsul cap-coadă</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Îți configurezi pagina publică, serviciile și programul, apoi testezi fluxul complet de rezervare înainte să rămâi pe abonament.
            </p>
          </article>
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">Fără surprize</p>
            <h2 className="mt-3 text-xl font-semibold text-zinc-100">Preț lunar simplu, fără comision per rezervare</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Nu plătești extra pentru fiecare client care rezervă. Modelul este clar: un abonament lunar fix pentru business-ul tău.
            </p>
          </article>
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">Încredere operațională</p>
            <h2 className="mt-3 text-xl font-semibold text-zinc-100">Vezi legalul, statusul și suportul într-un loc</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Paginile publice de status și documentele operaționale sunt disponibile direct din site, astfel încât să știi pe ce te bazezi înainte de activare.
            </p>
          </article>
        </section>

        <CalculatorEconomii />

        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-800/70 text-zinc-200">
              <tr>
                <th className="px-4 py-3">Comparație</th>
                <th className="px-4 py-3 text-emerald-300">OcupaLoc</th>
                <th className="px-4 py-3">Platformă standard</th>
                <th className="px-4 py-3">Platformă premium</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.feature} className="border-t border-zinc-800">
                  <td className="px-4 py-3 text-zinc-200">{row.feature}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-300">
                    {row.ocupaloc === "Da" ? "✓ Da" : row.ocupaloc}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{row.standard}</td>
                  <td className="px-4 py-3 text-zinc-400">{row.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="flex justify-center">
          {user ? (
            <Link href="/api/billing/create-checkout" data-cta-location="preturi_footer_cta" className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500">
              Activează abonamentul
            </Link>
          ) : (
            <Link href="/signup" data-cta-location="preturi_footer_cta" className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500">
              Creează cont gratuit
            </Link>
          )}
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">Întrebări scurte, răspunsuri directe</p>
            <div className="mt-5 space-y-5 text-sm leading-7 text-zinc-300">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">Pot anula înainte să rămân pe abonament?</h2>
                <p className="mt-1 text-zinc-400">Da. Înainte să continui pe planul plătit, verifică dacă produsul se potrivește business-ului tău și decide informat.</p>
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-100">Ce include planul actual?</h2>
                <p className="mt-1 text-zinc-400">Pagina publică de rezervări, servicii, sloturi, dashboard, confirmări email și administrarea zilnică a programărilor.</p>
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-100">Am vizibilitate dacă apare o problemă tehnică?</h2>
                <p className="mt-1 text-zinc-400">Da. Pagina publică de status arată verificările esențiale ale platformei, iar documentele legale și datele de contact sunt publice.</p>
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-zinc-800 bg-zinc-900 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">Linkuri utile înainte de activare</p>
            <div className="mt-5 space-y-3 text-sm text-zinc-300">
              <Link href="/status" className="flex items-center justify-between rounded-xl border border-zinc-800 px-4 py-3 transition hover:border-zinc-700 hover:bg-zinc-800/60">
                <span>Status sistem</span>
                <span className="text-zinc-500">Vezi verificările live</span>
              </Link>
              <Link href="/suport" className="flex items-center justify-between rounded-xl border border-zinc-800 px-4 py-3 transition hover:border-zinc-700 hover:bg-zinc-800/60">
                <span>Centru suport</span>
                <span className="text-zinc-500">Contact și onboarding</span>
              </Link>
              <Link href="/termeni" className="flex items-center justify-between rounded-xl border border-zinc-800 px-4 py-3 transition hover:border-zinc-700 hover:bg-zinc-800/60">
                <span>Termeni și condiții</span>
                <span className="text-zinc-500">Condițiile de utilizare</span>
              </Link>
              <Link href="/confidentialitate" className="flex items-center justify-between rounded-xl border border-zinc-800 px-4 py-3 transition hover:border-zinc-700 hover:bg-zinc-800/60">
                <span>Confidențialitate</span>
                <span className="text-zinc-500">Cum sunt tratate datele</span>
              </Link>
              <Link href="/gdpr" className="flex items-center justify-between rounded-xl border border-zinc-800 px-4 py-3 transition hover:border-zinc-700 hover:bg-zinc-800/60">
                <span>Informare GDPR</span>
                <span className="text-zinc-500">Drepturile tale</span>
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
