import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Informare GDPR",
  description: "Rezumatul drepturilor GDPR și al modului în care poți face o solicitare privind datele personale în OcupaLoc."
};

const sections = [
  {
    title: "1. Rolurile privind datele",
    paragraphs: [
      "Atunci când un business folosește OcupaLoc pentru a gestiona programări, acel business este în mod normal operatorul principal pentru datele clienților săi. OcupaLoc furnizează infrastructura software și procesează datele în măsura necesară pentru funcționarea serviciului.",
      "Pentru datele colectate direct de OcupaLoc prin site, cont, billing sau suport, OcupaLoc poate acționa și ca operator direct."
    ]
  },
  {
    title: "2. Drepturile persoanei vizate",
    paragraphs: ["Conform GDPR, poți avea următoarele drepturi, în funcție de situația concretă și de temeiul legal aplicabil:"],
    bullets: [
      "dreptul de acces la datele personale;",
      "dreptul la rectificare;",
      "dreptul la ștergere;",
      "dreptul la restricționarea prelucrării;",
      "dreptul la portabilitatea datelor;",
      "dreptul la opoziție;",
      "dreptul de a depune plângere la autoritatea de supraveghere competentă."
    ]
  },
  {
    title: "3. Cum faci o solicitare",
    paragraphs: [
      `Ne poți trimite o solicitare la ${CONTACT_EMAIL} cu suficiente detalii pentru a te identifica și pentru a înțelege exact ce dorești: acces, rectificare, export, ștergere sau limitare.`,
      "Dacă solicitarea privește o programare făcută la un business care folosește OcupaLoc, este posibil să te direcționăm și către acel business, deoarece el stabilește scopurile și mijloacele principale ale prelucrării pentru relația cu propriii clienți."
    ]
  },
  {
    title: "4. Timp de răspuns",
    paragraphs: [
      "Încercăm să răspundem fără întârzieri nejustificate și, de regulă, în termenul prevăzut de lege. Pentru cereri complexe sau volum mare de solicitări, termenul poate fi prelungit în limitele permise de legislație.",
      "Pentru protecția datelor, este posibil să cerem informații suplimentare de verificare a identității înainte de a procesa cererea."
    ]
  },
  {
    title: "5. Transferuri și furnizori",
    paragraphs: [
      "Datele pot fi procesate prin furnizori tehnici folosiți pentru hosting, baze de date, email tranzacțional, plăți și observabilitate. Selectăm furnizori potriviți pentru un serviciu online modern și implementăm măsuri contractuale și tehnice rezonabile.",
      "Dacă apar transferuri internaționale, acestea trebuie să se bazeze pe mecanisme adecvate conform legislației aplicabile."
    ]
  },
  {
    title: "6. Minimarea datelor",
    paragraphs: [
      "Concepem produsul astfel încât business-urile să colecteze în mod normal doar informațiile necesare pentru programare, comunicare operațională și administrarea relației cu clientul.",
      "Recomandăm utilizatorilor platformei să evite introducerea în mod inutil a unor categorii speciale de date sau a unor informații excesive."
    ]
  }
] as const;

export default function Page() {
  return (
    <LegalPage
      eyebrow="GDPR"
      title="Informare GDPR"
      intro="Această pagină rezumă drepturile principale pe care le ai în legătură cu datele personale și modul în care poți trimite o cerere privind datele procesate prin OcupaLoc."
      lastUpdated="26 aprilie 2026"
      sections={sections}
    />
  );
}
