"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";

const CONSENT_KEY = "OCUPALOC_COOKIE_CONSENT_ANALYTICS";

type ConsentState = "unknown" | "accepted" | "rejected";

function readConsent(): ConsentState {
  if (typeof window === "undefined") return "unknown";
  const raw = window.localStorage.getItem(CONSENT_KEY);
  if (raw === "accepted") return "accepted";
  if (raw === "rejected") return "rejected";
  return "unknown";
}

export function ConsentAwareAnalytics({ gaId }: { gaId?: string }) {
  const [consent, setConsent] = useState<ConsentState>("unknown");
  const hasGa = useMemo(() => Boolean(gaId), [gaId]);

  useEffect(() => {
    setConsent(readConsent());
  }, []);

  const acceptAnalytics = () => {
    window.localStorage.setItem(CONSENT_KEY, "accepted");
    setConsent("accepted");
  };

  const rejectAnalytics = () => {
    window.localStorage.setItem(CONSENT_KEY, "rejected");
    setConsent("rejected");
  };

  return (
    <>
      {hasGa && consent === "accepted" ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `
            }}
          />
        </>
      ) : null}

      {consent === "unknown" ? (
        <div
          data-testid="cookie-consent-banner"
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-3xl rounded-2xl border border-amber-300/25 bg-slate-950/95 p-4 text-sm shadow-2xl backdrop-blur"
        >
          <p className="text-amber-50">
            Folosim cookies pentru masurare trafic si imbunatatirea experientei. Analytics va porni doar dupa
            acceptul tau.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={acceptAnalytics}
              className="lux-cta px-4 py-2 text-sm"
              data-testid="cookie-consent-accept"
            >
              Accept analytics
            </button>
            <button
              type="button"
              onClick={rejectAnalytics}
              className="lux-outline px-4 py-2 text-sm"
              data-testid="cookie-consent-reject"
            >
              Refuz
            </button>
            <Link href="/cookies" className="self-center text-amber-200 underline underline-offset-4">
              Vezi politica cookies
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
