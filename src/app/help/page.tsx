import Link from "next/link";

import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/lib/contact";

const triageQuestions = [
  "Ce URL ai accesat când a apărut problema?",
  "Ce pas exact ai făcut înainte de eroare?",
  "Ai primit un mesaj de eroare? Dacă da, care este textul?",
  "Problema afectează toți clienții sau doar un singur cont?"
];

export default function HelpPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-6 py-14 text-zinc-100">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Ajutor și suport</h1>
        <p className="text-zinc-300">
          Pentru probleme de cont, billing sau booking, trimite un email la
          <a href={CONTACT_MAILTO} className="ml-1 underline underline-offset-4">{CONTACT_EMAIL}</a>.
        </p>
      </header>

      <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="text-xl font-semibold">Ce să incluzi în solicitare</h2>
        <ul className="list-disc space-y-1 pl-6 text-zinc-300">
          {triageQuestions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="text-xl font-semibold">Întrebări frecvente</h2>
        <details className="rounded-lg border border-zinc-700 p-4">
          <summary className="cursor-pointer font-medium">Cum reactivez abonamentul după anulare?</summary>
          <p className="mt-2 text-sm text-zinc-300">Intră în dashboard și folosește butonul &quot;Gestionează abonamentul&quot; pentru a deschide portalul Stripe.</p>
        </details>
        <details className="rounded-lg border border-zinc-700 p-4">
          <summary className="cursor-pointer font-medium">De ce nu primesc emailurile de reminder?</summary>
          <p className="mt-2 text-sm text-zinc-300">Verifică dacă adresa este validă și contactează suportul cu ora aproximativă a programării afectate.</p>
        </details>
      </section>

      <section className="space-y-2 text-sm text-zinc-400">
        <p>Documentația operațională pentru echipa internă este în PRODUCTION.md și RELEASE_RUNBOOK.md.</p>
        <p>
          Vezi și <Link href="/confidentialitate" className="underline underline-offset-4">Politica de confidențialitate</Link> pentru detalii GDPR.
        </p>
      </section>
    </main>
  );
}