/** JSON-LD pentru homepage — Ziua 11 plan SEO (LocalBusiness + SoftwareApplication). */

export const ocupalocLocalBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://ocupaloc.ro/#localbusiness",
  name: "OcupaLoc",
  url: "https://ocupaloc.ro",
  logo: "https://ocupaloc.ro/og-image.svg",
  image: "https://ocupaloc.ro/og-image.svg",
  description: "Software românesc de programări pentru saloane",
  priceRange: "RON",
  areaServed: {
    "@type": "Country",
    name: "Romania"
  },
  address: {
    "@type": "PostalAddress",
    addressCountry: "RO"
  }
} as const;

export const ocupalocSoftwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "OcupaLoc",
  applicationCategory: "BusinessApplication",
  offers: {
    "@type": "Offer",
    price: "59.99",
    priceCurrency: "RON"
  },
  description:
    "Software de programări online pentru orice business bazat pe rezervări, cu preț fix și flux complet de confirmare.",
  operatingSystem: "Web"
} as const;
