import Script from "next/script";

import { LandingPage } from "@/components/landing/LandingPage";

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
