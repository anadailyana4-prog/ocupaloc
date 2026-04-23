"use client";

import Link from "next/link";
import { useEffect } from "react";

import { reportClientError } from "@/lib/client-error-reporting";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    reportClientError("app", error, { digest: error.digest });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-2xl rounded-[28px] border border-border bg-card/95 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">Ocupaloc</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold text-foreground">Ceva s-a rupt pe traseu</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
          Cererea nu a putut fi finalizată. Reîncearcă aceeași acțiune sau revino la pagina anterioară fără să pierzi tot contextul.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-w-44 items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90"
          >
            Încearcă din nou
          </button>
          <Link
            href="/"
            className="inline-flex min-w-44 items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Înapoi la homepage
          </Link>
        </div>
        {error.digest ? <p className="mt-5 text-xs text-muted-foreground">Cod intern: {error.digest}</p> : null}
      </div>
    </main>
  );
}