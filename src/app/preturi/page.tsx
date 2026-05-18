import type { Metadata } from "next";
import Link from "next/link";

import { CalculatorEconomii } from "@/components/CalculatorEconomii";
import { getUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
 title: "Prețuri Software Programări Salon | 59,99 RON/lună Fără Comision",
 description:
 "Software programări online salon la 59,99 RON/lună, fără comision. Rezervarea este online, iar plata la rezervare nu este inclusă. Compară cu Fresha, Treatwell și Booksy și vezi cât economisești pe an.",
 alternates: { canonical: "https://ocupaloc.ro/preturi" }
};

const comparisonRows = [
 { feature: "Preț lunar", ocupaloc: "59,99 RON", standard: "Variabil", premium: "Variabil" },
 { feature: "Comision per programare", ocupaloc: "0 RON", standard: "Da", premium: "Da" },
 { feature: "Suport în română", ocupaloc: "Da", standard: "Limitat", premium: "Da" },
 { feature: "Fără reclame", ocupaloc: "Da", standard: "Nu", premium: "Nu" },
 { feature: "Import clienți gratuit", ocupaloc: "Da", standard: "Limitat", premium: "Limitat" },
 { feature: "Personalizare completă", ocupaloc: "Da", standard: "Parțial", premium: "Parțial" },
 { feature: "Plată online la rezervare", ocupaloc: "Nu este inclusă", standard: "Da", premium: "Da" }
] as const;

export default async function PreturiPage() {
 const user = await getUser();
 const pricingFaq = [
 { question: "Cât costă OcupaLoc?", answer: "OcupaLoc costă 59,99 RON pe lună per locație, TVA inclus." },
 {
 question: "Există comision per programare?",
 answer: "Nu. Planul este cu zero comision per programare și cost lunar fix."
 },
 {
 question: "Pot testa înainte de activare?",
 answer: "Da. Poți începe cu 14 zile gratuite pentru a valida fluxul complet de rezervări."
 }
 ] as const;

 const offerSchema = {
 "@context": "https://schema.org",
 "@type": "SoftwareApplication",
 name: "OcupaLoc",
 applicationCategory: "BusinessApplication",
 operatingSystem: "Web",
 url: "https://ocupaloc.ro/preturi",
 offers: {
 "@type": "Offer",
 priceCurrency: "RON",
 price: "59.99",
 priceValidUntil: "2027-12-31",
 availability: "https://schema.org/InStock",
 url: "https://ocupaloc.ro/signup?start=1"
 }
 };

 const faqSchema = {
 "@context": "https://schema.org",
 "@type": "FAQPage",
 mainEntity: pricingFaq.map((item) => ({
 "@type": "Question",
 name: item.question,
 acceptedAnswer: {
 "@type": "Answer",
 text: item.answer
 }
 }))
 };

 return (
 <main className="min-h-screen bg-white px-6 py-14 oc-text">
 <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offerSchema) }} />
 <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
 <div className="mx-auto max-w-6xl space-y-10">
 <header className="space-y-4 text-center">
 <h1 className="text-4xl font-bold tracking-tight md:text-5xl">59,99 RON pe lună. Atât.</h1>
 <p className="text-lg oc-secondary-text">Fără comisioane ascunse. Fără taxă per programare. Rezervarea este online; plata la rezervare nu este inclusă.</p>
 </header>

 <section className="mx-auto max-w-xl rounded-2xl border oc-border bg-white p-8 text-center">
 <p className="text-sm uppercase tracking-wide oc-secondary-text">Plan unic OcupaLoc</p>
 <p className="mt-3 text-5xl font-black">
 59,99 <span className="text-xl font-medium oc-secondary-text">RON/lună</span>
 </p>
 <ul className="mt-6 space-y-2 text-left text-sm oc-text">
 <li>✓ Programări nelimitate</li>
 <li>✓ Zero comision per programare</li>
 <li>✓ Link personalizat de rezervare</li>
 <li>✓ Import clienți gratuit</li>
 <li>✓ Suport rapid în limba română</li>
 </ul>
 {user ? (
 <Link href="/api/billing/create-checkout" data-cta-location="preturi_hero_card" className="mt-6 inline-flex rounded-lg oc-primary px-6 py-3 font-semibold text-white hover:bg-[#D97706]">
 Activează abonamentul
 </Link>
 ) : (
 <Link href="/signup?start=1" data-cta-location="preturi_hero_card" className="mt-6 inline-flex rounded-lg oc-primary px-6 py-3 font-semibold text-white hover:bg-[#D97706]">
 Încearcă 14 zile gratis
 </Link>
 )}
 </section>

 <section className="grid gap-6 md:grid-cols-3">
 <article className="rounded-2xl border oc-border bg-white p-6">
 <p className="text-sm font-semibold uppercase tracking-[0.18em] oc-secondary-text">Trial clar</p>
 <h2 className="mt-3 text-xl font-semibold oc-text">14 zile ca să vezi produsul cap-coadă</h2>
 <p className="mt-3 text-sm leading-6 oc-secondary-text">
 Îți configurezi pagina publică, serviciile și programul, apoi testezi fluxul complet de rezervare înainte să rămâi pe abonament.
 </p>
 </article>
 <article className="rounded-2xl border oc-border bg-white p-6">
 <p className="text-sm font-semibold uppercase tracking-[0.18em] oc-secondary-text">Fără surprize</p>
 <h2 className="mt-3 text-xl font-semibold oc-text">Preț lunar simplu, fără comision per rezervare</h2>
 <p className="mt-3 text-sm leading-6 oc-secondary-text">
 Nu plătești extra pentru fiecare client care rezervă. Modelul este clar: un abonament lunar fix pentru business-ul tău. Rezervarea este online, iar plata la rezervare nu este inclusă în plan.
 </p>
 </article>
 <article className="rounded-2xl border oc-border bg-white p-6">
 <p className="text-sm font-semibold uppercase tracking-[0.18em] oc-secondary-text">Încredere operațională</p>
 <h2 className="mt-3 text-xl font-semibold oc-text">Vezi legalul, statusul și suportul într-un loc</h2>
 <p className="mt-3 text-sm leading-6 oc-secondary-text">
 Paginile publice de status și documentele operaționale sunt disponibile direct din site, astfel încât să știi pe ce te bazezi înainte de activare.
 </p>
 </article>
 </section>

 <CalculatorEconomii />

 <section className="overflow-hidden rounded-2xl border oc-border bg-white">
 <table className="w-full text-left text-sm">
 <thead className="oc-badge-bg oc-text">
 <tr>
 <th className="px-4 py-3">Comparație</th>
 <th className="px-4 py-3 text-emerald-300">OcupaLoc</th>
 <th className="px-4 py-3">Platformă standard</th>
 <th className="px-4 py-3">Platformă premium</th>
 </tr>
 </thead>
 <tbody>
 {comparisonRows.map((row) => (
 <tr key={row.feature} className="border-t oc-border">
 <td className="px-4 py-3 oc-text">{row.feature}</td>
 <td className="px-4 py-3 font-semibold text-emerald-300">
 {row.ocupaloc === "Da" ? "✓ Da" : row.ocupaloc}
 </td>
 <td className="px-4 py-3 oc-secondary-text">{row.standard}</td>
 <td className="px-4 py-3 oc-secondary-text">{row.premium}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </section>

 <div className="flex justify-center">
 {user ? (
 <Link href="/api/billing/create-checkout" data-cta-location="preturi_footer_cta" className="rounded-lg oc-primary px-6 py-3 font-semibold text-white hover:bg-[#D97706]">
 Activează abonamentul
 </Link>
 ) : (
 <Link href="/signup?start=1" data-cta-location="preturi_footer_cta" className="rounded-lg oc-primary px-6 py-3 font-semibold text-white hover:bg-[#D97706]">
 Creează cont gratuit
 </Link>
 )}
 </div>

 <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
 <div className="rounded-2xl border oc-border bg-white p-7">
 <p className="text-sm font-semibold uppercase tracking-[0.18em] oc-secondary-text">FAQ billing public</p>
 <div className="mt-5 space-y-5 text-sm leading-7 oc-text">
 <div>
 <h2 className="text-base font-semibold oc-text">Când primesc trial și îl pot primi din nou?</h2>
 <p className="mt-1 oc-secondary-text">Trialul implicit se acordă o singură dată per business identity. La reactivare nu se acordă automat o nouă perioadă de trial.</p>
 </div>
 <div>
 <h2 className="text-base font-semibold oc-text">Cum funcționează anularea abonamentului?</h2>
 <p className="mt-1 oc-secondary-text">Poți alege anulare imediată sau oprirea reînnoirii la finalul perioadei curente. Istoricul de billing rămâne păstrat pentru audit și suport.</p>
 </div>
 <div>
 <h2 className="text-base font-semibold oc-text">Ce se întâmplă la finalul perioadei plătite?</h2>
 <p className="mt-1 oc-secondary-text">Dacă ai setat cancel la final de perioadă, accesul rămâne activ până la data de expirare curentă, apoi statusul devine anulat.</p>
 </div>
 <div>
 <h2 className="text-base font-semibold oc-text">Ce include planul actual?</h2>
 <p className="mt-1 oc-secondary-text">Pagina publică de rezervări, servicii, sloturi, meniu de administrare, confirmări email și gestionarea zilnică a programărilor. Plata online la rezervare nu este inclusă acum.</p>
 </div>
 <div>
 <h2 className="text-base font-semibold oc-text">Am vizibilitate dacă apare o problemă tehnică?</h2>
 <p className="mt-1 oc-secondary-text">Da. Pagina publică de status arată verificările esențiale ale platformei, iar documentele legale și datele de contact sunt publice.</p>
 </div>
 </div>
 </div>

 <aside className="rounded-2xl border oc-border bg-white p-7">
 <p className="text-sm font-semibold uppercase tracking-[0.18em] oc-secondary-text">Linkuri utile înainte de activare</p>
 <div className="mt-5 space-y-3 text-sm oc-text">
 <Link href="/status" className="flex items-center justify-between rounded-xl border oc-border px-4 py-3 transition hover:oc-border hover:oc-badge-bg">
 <span>Status sistem</span>
 <span className="oc-secondary-text">Vezi verificările live</span>
 </Link>
 <Link href="/suport" className="flex items-center justify-between rounded-xl border oc-border px-4 py-3 transition hover:oc-border hover:oc-badge-bg">
 <span>Centru suport</span>
 <span className="oc-secondary-text">Contact și onboarding</span>
 </Link>
 <Link href="/termeni" className="flex items-center justify-between rounded-xl border oc-border px-4 py-3 transition hover:oc-border hover:oc-badge-bg">
 <span>Termeni și condiții</span>
 <span className="oc-secondary-text">Condițiile de utilizare</span>
 </Link>
 <Link href="/confidentialitate" className="flex items-center justify-between rounded-xl border oc-border px-4 py-3 transition hover:oc-border hover:oc-badge-bg">
 <span>Confidențialitate</span>
 <span className="oc-secondary-text">Cum sunt tratate datele</span>
 </Link>
 <Link href="/gdpr" className="flex items-center justify-between rounded-xl border oc-border px-4 py-3 transition hover:oc-border hover:oc-badge-bg">
 <span>Informare GDPR</span>
 <span className="oc-secondary-text">Drepturile tale</span>
 </Link>
 </div>
 </aside>
 </section>
 </div>
 </main>
 );
}
