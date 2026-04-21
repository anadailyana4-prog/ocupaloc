"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <h2>A apărut o eroare neașteptată.</h2>
        <button type="button" onClick={reset}>
          Încearcă din nou
        </button>
      </body>
    </html>
  );
}
