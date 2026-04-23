import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";

import { AnalyticsEvents } from "@/components/analytics/AnalyticsEvents";
import { Header } from "@/components/Header";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap"
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ocupaloc.ro"),
  title: {
    default: "Ocupaloc - Programări online pentru orice business",
    template: "%s | Ocupaloc"
  },
  description:
    "Creează linkul tău de programare online în 2 minute. Potrivit pentru saloane, clinici, consultanți, studiouri și orice business bazat pe programări.",
  keywords: ["programare online", "booking", "programari", "rezervari", "software programari", "business"],
  authors: [{ name: "Ocupaloc" }],
  creator: "Ocupaloc",
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: "https://ocupaloc.ro",
    siteName: "Ocupaloc",
    title: "Ocupaloc - Programări online pentru orice business",
    description: "Link de programare pentru servicii, clinici, saloane și profesioniști independenți",
    images: [{ url: "/og-image.svg", width: 1200, height: 630 }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Ocupaloc",
    description: "Programări online pentru orice business",
    images: ["/og-image.svg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true
    }
  },
  verification: {
    google: "codul-tau-aici"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Ocupaloc",
    url: "https://ocupaloc.ro",
    offers: {
      "@type": "Offer",
      price: "59.99",
      priceCurrency: "RON"
    }
  };

  return (
    <html lang="ro" className="dark" suppressHydrationWarning>
      <head>
        <Script id="organization-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        {gaId ? <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" /> : null}
        {gaId ? (
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
        ) : null}
        {clarityProjectId ? (
          <Script
            id="clarity-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${clarityProjectId}");`
            }}
          />
        ) : null}
      </head>
      <body className={`${jakarta.variable} ${cormorant.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <AnalyticsEvents />
        <Header />
        {children}
        <Toaster
          richColors
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "#09090b",
              color: "#fafafa",
              border: "1px solid #27272a"
            }
          }}
        />
      </body>
    </html>
  );
}
