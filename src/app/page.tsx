import Script from "next/script";

import { LandingPage } from "@/components/landing/LandingPage";
import { MONTHLY_PRICE_LEI } from "@/config/marketing";

export default function Home() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Ocupaloc",
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer",
      price: String(MONTHLY_PRICE_LEI),
      priceCurrency: "RON"
    },
    description: "Software de programări online pentru saloane beauty, cu zero comision pe programare.",
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
