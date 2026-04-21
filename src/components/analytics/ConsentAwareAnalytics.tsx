"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useMemo, useState } from "react";

const CONSENT_KEY = "ocupaloc_cookie_consent_analytics";

type ConsentValue = "accepted" | "rejected";

function readStoredConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(CONSENT_KEY);
  return value === "accepted" || value === "rejected" ? value : null;
}

export function ConsentAwareAnalytics({ gaId }: { gaId?: string }) {
  const [consent, setConsent] = useState<ConsentValue | null>(null);

  useEffect(() => {
    setConsent(readStoredConsent());
  }, []);

  const shouldLoadGa = useMemo(() => Boolean(gaId) && consent === "accepted", [gaId, consent]);
  const shouldShowBanner = Boolean(gaId) && consent === null;

  const updateConsent = (value: ConsentValue) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CONSENT_KEY, value);
    }
    setConsent(value);
  };

  return (
    <>
      {shouldLoadGa && gaId ? <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" /> : null}
      {shouldLoadGa && gaId ? (
        <Script
          id="ga4-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaId}', { anonymize_ip: true });
            `
          }}
        />
      ) : null}

      {shouldShowBanner ? (
        <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-xl border border-zinc-700 bg-zinc-950/95 p-4 text-sm text-zinc-200 shadow-2xl backdrop-blur">
          <p>
            Folosim cookies de analytics (Google Analytics) pentru a masura unde se opresc utilizatorii in onboarding si booking, fara a trimite date
            personale. Detalii in <Link href="/cookies" className="underline underline-offset-4">Politica de cookies</Link> si{" "}
            <Link href="/confidentialitate" className="underline underline-offset-4">Politica de confidențialitate</Link>.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateConsent("accepted")}
              className="rounded-md bg-amber-200 px-3 py-1.5 font-medium text-zinc-900 hover:bg-amber-100"
            >
              Accept analytics
            </button>
            <button
              type="button"
              onClick={() => updateConsent("rejected")}
              className="rounded-md border border-zinc-600 px-3 py-1.5 text-zinc-100 hover:bg-zinc-800"
            >
              Refuz
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}