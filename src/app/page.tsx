import Script from "next/script";

import { LandingPage } from "@/components/landing/LandingPage";
import { DEFAULT_OG_IMAGE, SITE_URL, absoluteUrl } from "@/lib/seo";

export default function Home() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "OcupaLoc",
    url: SITE_URL,
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    applicationCategory: "BusinessApplication",
    softwareHelp: absoluteUrl("/suport"),
    offers: {
      "@type": "Offer",
      price: "59.99",
      priceCurrency: "RON",
      url: absoluteUrl("/preturi"),
      availability: "https://schema.org/InStock"
    },
    description: "Software de programări online pentru orice business bazat pe rezervări, cu preț fix și flux complet de confirmare.",
    operatingSystem: "Web"
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cât costă OcupaLoc?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "OcupaLoc costă 59,99 RON/lună, cu TVA inclus și zero comision per programare."
        }
      },
      {
        "@type": "Question",
        name: "Pentru ce businessuri este potrivit?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "OcupaLoc este potrivit pentru saloane, frizerii, clinici, consultanți, studiouri și alte servicii locale bazate pe programări."
        }
      }
    ]
  };

  return (
    <>
      <Script
        id="software-application-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <Script
        id="homepage-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <LandingPage />
    </>
  );
}
