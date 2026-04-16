import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";

import { AnalyticsEvents } from "@/components/analytics/AnalyticsEvents";
import { Header } from "@/components/Header";
import { MONTHLY_PRICE_LEI } from "@/config/marketing";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ocupaloc.ro"),
  title: {
    default: "Ocupaloc - Link de programare pentru frizeri și saloane",
    template: "%s | Ocupaloc"
  },
  description:
    "Programări online pentru saloane și frizerii din România. Preț fix lunar, zero comision pe rezervare. Link personalizat, confirmări și panou simplu.",
  keywords: ["programare online", "frizer", "coafor", "salon", "booking", "programari"],
  authors: [{ name: "Ocupaloc" }],
  creator: "Ocupaloc",
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: "https://ocupaloc.ro",
    siteName: "Ocupaloc",
    title: "Ocupaloc - Programări online pentru saloane",
    description: "Programări online pentru saloane — preț fix lunar, zero comision pe rezervare.",
    images: [{ url: "/og-image.svg", width: 1200, height: 630 }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Ocupaloc",
    description: "Programări online pentru saloane",
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
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {})
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Ocupaloc",
    url: "https://ocupaloc.ro",
    offers: {
      "@type": "Offer",
      price: String(MONTHLY_PRICE_LEI),
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
      </head>
      <body className={`${inter.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
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
