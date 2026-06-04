import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo interactiv — configurează programări online | OcupaLoc",
  description:
    "Creează în 3 pași un demo personalizat cu servicii și sloturi. Vezi cum arată pagina ta de rezervări fără cont obligatoriu.",
  alternates: { canonical: "https://ocupaloc.ro/demo-interactiv" },
  openGraph: {
    title: "Demo interactiv OcupaLoc",
    description: "Configurează un demo de programări online pentru salonul tău în câteva minute.",
    type: "website",
    url: "https://ocupaloc.ro/demo-interactiv"
  }
};

export default function DemoInteractivLayout({ children }: { children: React.ReactNode }) {
  return children;
}
