import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Changelog OcupaLoc",
  description: "Actualizări recente ale platformei OcupaLoc: funcții noi și îmbunătățiri.",
  alternates: { canonical: "https://ocupaloc.ro/changelog" }
};

const entries: Array<{ date: string; text: string }> = [
  { date: "2026-05-20", text: "Widget embed gratuit (widget.js) pentru programări pe site-uri externe." },
  { date: "2026-05-20", text: "API public servicii + CORS pentru fluxul de rezervare din widget." },
  { date: "2026-05-20", text: "Dashboard: checklist gamificat cu progres și badge „Setup complet”." },
  { date: "2026-05-20", text: "Pagină Demo marketing (Studio Beauty) cu sloturi pentru ziua curentă." },
  { date: "2026-05-20", text: "Previzualizare pagină publică în dashboard cu copiere link și cod QR." },
  { date: "2026-05-20", text: "Pagină Changelog vizibilă pentru transparență produs." },
  {
    date: "2026-04-24",
    text: "Lansare platformă multi-tenant: pagini publice, dashboard, billing Stripe, notificări email."
  }
];

export default function ChangelogPage() {
  return (
    <main className="min-h-screen oc-bg px-4 py-14 oc-text">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight">Changelog</h1>
        <p className="mt-2 text-sm oc-secondary-text">
          Ultimele schimbări notabile. Fișierul complet <code className="rounded bg-zinc-100 px-1 text-xs">CHANGELOG.md</code>{" "}
          din repo conține istoricul versiunilor.
        </p>
        <ul className="mt-10 space-y-4">
          {entries.map((e) => (
            <li key={`${e.date}-${e.text}`} className="rounded-xl border oc-border bg-white px-4 py-3 text-sm leading-relaxed">
              <span className="font-semibold oc-accent">✅ [{e.date}]</span> — {e.text}
            </li>
          ))}
        </ul>
        <p className="mt-10 text-center text-xs oc-secondary-text">
          <Link href="/" className="oc-accent underline">
            ← Înapoi la site
          </Link>
        </p>
      </div>
    </main>
  );
}
