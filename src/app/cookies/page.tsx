import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Politica de cookies",
  description: "Detalii despre modulele cookie și tehnologiile similare folosite de site-ul și platforma OcupaLoc."
};

const sections = [
  {
    title: "1. Ce sunt cookies",
    paragraphs: [
      "Cookies sunt fișiere mici stocate în browser care ajută un site să funcționeze corect, să rețină preferințe și să înțeleagă utilizarea produsului.",
      "OcupaLoc poate folosi atât cookies proprii, cât și tehnologii similare oferite de furnizori terți integrați în produs."
    ]
  },
  {
    title: "2. Categorii de cookies folosite",
    paragraphs: ["În funcție de funcțiile active în produs, putem folosi următoarele categorii:"],
    bullets: [
      "cookies strict necesare pentru autentificare, securitate, sesiune și funcționarea paginilor;",
      "cookies de preferințe pentru a reține setări sau comportamente legitime ale interfeței;",
      "cookies și scripturi de analiză pentru a înțelege cum este folosit produsul și pentru a îmbunătăți experiența;",
      "tehnologii operaționale pentru monitorizare, depanare și detecția incidentelor."
    ]
  },
  {
    title: "3. Exemple de scopuri",
    paragraphs: ["Aceste tehnologii ne pot ajuta să:"],
    bullets: [
      "menținem utilizatorii autentificați în sesiune;",
      "protejăm formularele și fluxurile sensibile împotriva abuzurilor;",
      "măsurăm performanța paginilor și identificăm erorile tehnice;",
      "analizăm paginile vizitate și acțiunile importante din produs, atunci când aceste integrări sunt active."
    ]
  },
  {
    title: "4. Cum le poți controla",
    paragraphs: [
      "Poți controla sau șterge cookies din setările browserului tău. Reține însă că blocarea cookies esențiale poate afecta funcționarea contului, autentificarea și rezervările online.",
      "Dacă activăm integrări analitice opționale, vom urmări să le folosim proporțional și transparent în raport cu scopul lor operațional."
    ]
  },
  {
    title: "5. Actualizări",
    paragraphs: [
      "Putem actualiza această pagină atunci când modificăm furnizorii, funcțiile produsului sau modul în care folosim tehnologii similare cookie-urilor.",
      "Versiunea publicată pe site este cea aplicabilă la data consultării."
    ]
  }
] as const;

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Cookies"
      title="Politica de cookies"
      intro="Aici explicăm pe scurt ce tipuri de cookies și tehnologii similare pot fi folosite pe site-ul și în platforma OcupaLoc și în ce scop."
      lastUpdated="26 aprilie 2026"
      sections={sections}
    />
  );
}
