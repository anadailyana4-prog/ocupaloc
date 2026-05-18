import Script from "next/script";

import { LandingPage } from "@/components/landing/LandingPage";

export const metadata = {
  title: "OcupaLoc | Programări online pentru saloane, clinici și servicii locale",
  description:
    "OcupaLoc este un SaaS românesc de programări online pentru saloane, clinici și servicii locale. Clienții rezervă singuri, iar business-ul vede totul clar dintr-un singur loc."
};

export default function Home() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "OcupaLoc",
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer",
      price: "59.99",
      priceCurrency: "RON"
    },
    description: "Software de programări online pentru orice business bazat pe rezervări, cu preț fix și flux complet de confirmare.",
    operatingSystem: "Web"
  };

  return (
    <>
      <Script
        id="software-application-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <LandingPage />
    </>
  );
}
