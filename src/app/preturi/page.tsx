import type { Metadata } from "next";
import Link from "next/link";

import { CalculatorEconomii } from "@/components/CalculatorEconomii";
import { getUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "59,99 RON/lună pentru saloane beauty",
  description:
    "59,99 RON pe lună, fără comisioane ascunse. Vezi cât economisești față de platformele cu comision și compară Ocupaloc cu alternativele."
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
          <p className="text-sm uppercase tracking-wide text-zinc-400">Plan unic Ocupaloc</p>
          <p className="mt-3 text-5xl font-black">
            59,99 <span className="text-xl font-medium text-zinc-400">RON/lună</span>
          </p>
          <ul className="mt-6 space-y-2 text-left text-sm text-zinc-300">
            <li>✓ Programări nelimitate</li>
            <li>✓ Zero comision per programare</li>
            <li>✓ Link personalizat pentru salon</li>
            <li>✓ Import clienți gratuit</li>
            <li>✓ Suport rapid în limba română</li>
          </ul>
          {user ? (
            <form action="/api/billing/create-checkout" method="post" className="mt-6">
              <button type="submit" data-cta-location="preturi_hero_card" className="inline-flex rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500">
                Încearcă 14 zile gratis
              </button>
            </form>
          ) : (
            <Link href="/signup" data-cta-location="preturi_hero_card" className="mt-6 inline-flex rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500">
              Încearcă 14 zile gratis
            </Link>
          )}
        </section>

        <CalculatorEconomii />

        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-800/70 text-zinc-200">
              <tr>
                <th className="px-4 py-3">Comparație</th>
                <th className="px-4 py-3 text-emerald-300">Ocupaloc</th>
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
            <form action="/api/billing/create-checkout" method="post">
              <button type="submit" data-cta-location="preturi_footer_cta" className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500">
                Activează abonamentul
              </button>
            </form>
          ) : (
            <Link href="/signup" data-cta-location="preturi_footer_cta" className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500">
              Creează cont gratuit
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
