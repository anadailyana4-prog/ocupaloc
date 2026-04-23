"use client";

import Link from "next/link";
import { useEffect } from "react";

import { reportClientError } from "@/lib/client-error-reporting";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    reportClientError("global", error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="ro">
      <body className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
        <main className="w-full max-w-2xl rounded-[28px] border border-border bg-card/95 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">Ocupaloc</p>
          <h1 className="mt-4 font-serif text-4xl font-semibold text-foreground">Aplicația nu a putut fi încărcată</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
            A apărut o eroare la inițializare. Poți reîncărca aplicația sau reveni la homepage până când problema se stabilizează.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex min-w-44 items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90"
            >
              Reîncarcă aplicația
            </button>
            <Link
              href="/"
              className="inline-flex min-w-44 items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Mergi la homepage
            </Link>
          </div>
          {error.digest ? <p className="mt-5 text-xs text-muted-foreground">Cod intern: {error.digest}</p> : null}
        </main>
      </body>
    </html>
  );
}