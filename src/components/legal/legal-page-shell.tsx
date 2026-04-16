import Link from "next/link";
import type { ReactNode } from "react";

type LegalPageShellProps = {
  title: string;
  updated?: string;
  children: ReactNode;
};

export function LegalPageShell({ title, updated, children }: LegalPageShellProps) {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-14 text-zinc-100">
      <div className="mx-auto max-w-3xl space-y-10">
        <div className="space-y-2">
          <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">
            ← Înapoi la pagina principală
          </Link>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
          {updated ? <p className="text-sm text-zinc-500">Ultima actualizare: {updated}</p> : null}
        </div>
        <article className="space-y-6 text-sm leading-relaxed text-zinc-300 [&_h2]:mt-10 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-zinc-100 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </article>
      </div>
    </main>
  );
}
