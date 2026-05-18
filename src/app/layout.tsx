import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";

import { AnalyticsEvents } from "@/components/analytics/AnalyticsEvents";
import { Header } from "@/components/Header";
import { DEFAULT_OG_IMAGE, SITE_URL, canonical } from "@/lib/seo";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "OcupaLoc - Programări Online pentru Saloane, Clinici și Servicii",
    template: "%s | OcupaLoc"
  },
  description:
    "Software programări online pentru saloane beauty, frizerii, clinici și servicii. Preț fix 59,99 RON/lună, zero comision. Rezervări online în 30 de secunde.",
  keywords: [
    "programări online salon",
    "programari online saloane",
    "software programari salon",
    "rezervari online salon beauty",
    "sistem booking Romania",
    "aplicatie programari frizerie",
    "software programari manichiura",
    "programari online cosmetica",
    "booking online Romania",
    "programare online frizer"
  ],
  authors: [{ name: "OcupaLoc" }],
  creator: "OcupaLoc",
  alternates: canonical("/"),
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: SITE_URL,
    siteName: "OcupaLoc",
    title: "OcupaLoc - Programări Online pentru Saloane, Clinici și Servicii",
    description: "Sistem de rezervări online pentru saloane beauty, frizerii, clinici și profesioniști independenți. Fără comision, 59,99 RON/lună.",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "OcupaLoc - Programări online pentru saloane" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "OcupaLoc - Programări Online Saloane",
    description: "Programări online pentru saloane beauty fără comision. Preț fix 59,99 RON/lună.",
    images: [DEFAULT_OG_IMAGE]
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
    google: "x8NMYAcyCLn6mJQQy0e_bV_jG6lb9qqot3vfq6aiHLU"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OcupaLoc",
    url: SITE_URL,
    logo: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
    description: "Software programări online pentru saloane beauty, frizerii, manichiură și clinici din România.",
    areaServed: "RO",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "Romanian"
    },
    sameAs: ["https://www.facebook.com/ocupaloc", "https://www.instagram.com/ocupaloc"],
    offers: {
      "@type": "Offer",
      price: "59.99",
      priceCurrency: "RON",
      description: "Abonament lunar programări online"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OcupaLoc",
    url: SITE_URL,
    inLanguage: "ro-RO"
  };

  return (
    <html lang="ro" className="dark" suppressHydrationWarning>
      <head>
        <Script id="organization-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <Script id="website-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
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
