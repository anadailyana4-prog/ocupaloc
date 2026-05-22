import Script from "next/script";

import { LandingPage } from "@/components/landing/LandingPage";
import { ocupalocLocalBusinessSchema, ocupalocSoftwareApplicationSchema } from "@/lib/seo/homepage-schemas";

export const metadata = {
  title: "OcupaLoc | Programări online pentru saloane, clinici și servicii locale",
  description:
    "OcupaLoc este un SaaS românesc de programări online pentru saloane, clinici și servicii locale. Clienții rezervă singuri, iar business-ul vede totul clar dintr-un singur loc."
};

export default function Home() {
  return (
    <>
      <Script
        id="local-business-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ocupalocLocalBusinessSchema) }}
      />
      <Script
        id="software-application-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ocupalocSoftwareApplicationSchema) }}
      />
      <LandingPage />
    </>
  );
}
