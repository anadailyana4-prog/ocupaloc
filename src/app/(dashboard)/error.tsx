"use client";

import Link from "next/link";
import { useEffect } from "react";

import { reportClientError } from "@/lib/client-error-reporting";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    reportClientError("dashboard", error, { digest: error.digest });
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl rounded-[24px] border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Dashboard</p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">Nu am putut încărca această secțiune</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Datele tale există în continuare, dar această pagină a întâlnit o eroare temporară.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-w-40 items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90"
          >
            Reîncarcă secțiunea
          </button>
          <Link
            href="/dashboard"
            className="inline-flex min-w-40 items-center justify-center rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Mergi la dashboard
          </Link>
        </div>
        {error.digest ? <p className="mt-4 text-xs text-muted-foreground">Cod intern: {error.digest}</p> : null}
      </div>
    </main>
  );
}