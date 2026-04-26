import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Termeni și condiții",
  description: "Condițiile generale de utilizare pentru site-ul și platforma OcupaLoc."
};

const sections = [
  {
    title: "1. Obiectul serviciului",
    paragraphs: [
      "OcupaLoc oferă o platformă online prin care business-urile își pot gestiona programările, serviciile, disponibilitatea și anumite comunicări operaționale cu clienții lor.",
      "Prin utilizarea site-ului sau a platformei, confirmi că ai capacitatea legală de a accepta acești termeni și că vei folosi serviciul în mod licit și rezonabil."
    ]
  },
  {
    title: "2. Cont și acces",
    paragraphs: ["Ești responsabil pentru păstrarea confidențialității datelor de autentificare și pentru activitatea desfășurată din contul tău."],
    bullets: [
      "trebuie să furnizezi informații reale și actualizate;",
      "nu poți distribui accesul într-un mod care compromite securitatea contului;",
      "te obligi să ne anunți prompt dacă suspectezi acces neautorizat sau utilizare abuzivă."
    ]
  },
  {
    title: "3. Utilizare acceptată",
    paragraphs: ["Nu este permisă folosirea platformei pentru activități ilegale, abuzive sau care afectează funcționarea produsului ori experiența altor utilizatori."],
    bullets: [
      "trimiterea de conținut fraudulos, înșelător sau spam;",
      "încercări de acces neautorizat, extragere masivă de date sau ocolire a limitelor tehnice;",
      "folosirea produsului într-un mod care încalcă drepturile altor persoane sau legile aplicabile."
    ]
  },
  {
    title: "4. Abonamente, trial și plăți",
    paragraphs: [
      "Anumite funcționalități pot fi oferite în baza unui trial sau a unui abonament plătit. Condițiile comerciale active, inclusiv perioada de test și prețul afișat public, fac parte din oferta comercială disponibilă la momentul activării.",
      "În cazul unui abonament plătit, ești responsabil să menții o metodă de plată validă și să verifici dacă planul ales corespunde nevoilor tale operaționale."
    ]
  },
  {
    title: "5. Disponibilitatea serviciului",
    paragraphs: [
      "Depunem eforturi rezonabile pentru a menține platforma disponibilă și sigură, însă nu putem garanta funcționare neîntreruptă sau lipsa totală a erorilor.",
      "Putem efectua mentenanță planificată, actualizări sau măsuri de securitate care pot limita temporar accesul la anumite funcții."
    ]
  },
  {
    title: "6. Datele și conținutul tău",
    paragraphs: [
      "Tu rămâi responsabil pentru datele și conținutul pe care le introduci în platformă, inclusiv exactitatea informațiilor despre servicii, programări, prețuri și clienți.",
      "Ne acorzi dreptul necesar de a prelucra aceste date exclusiv pentru furnizarea, securizarea și îmbunătățirea serviciului, conform documentelor noastre de confidențialitate."
    ]
  },
  {
    title: "7. Proprietate intelectuală",
    paragraphs: [
      "Codul, designul, textele, marca și elementele vizuale ale produsului OcupaLoc rămân proprietatea noastră sau a licențiatorilor noștri, cu excepția conținutului pe care îl adaugi tu în contul tău.",
      "Nu poți copia, revinde, decompila, reproduce sau exploata comercial platforma în afara limitelor permise de lege și de acești termeni."
    ]
  },
  {
    title: "8. Limitarea răspunderii",
    paragraphs: [
      "În măsura permisă de lege, OcupaLoc nu răspunde pentru pierderi indirecte, pierderi de profit, pierderi de date sau prejudicii rezultate din utilizarea sau imposibilitatea utilizării serviciului.",
      "Răspunderea noastră totală, dacă există, se limitează la valoarea sumelor achitate efectiv pentru serviciu în perioada relevantă, cu excepția cazurilor în care legea prevede altfel."
    ]
  },
  {
    title: "9. Suspendare și încetare",
    paragraphs: [
      "Putem suspenda temporar sau definitiv accesul la cont dacă există suspiciuni rezonabile de fraudă, abuz, încălcarea termenilor, riscuri de securitate sau neplată.",
      "Poți înceta utilizarea serviciului în orice moment, iar anumite obligații care prin natura lor trebuie să supraviețuiască încetării vor rămâne aplicabile."
    ]
  },
  {
    title: "10. Contact",
    paragraphs: [
      `Pentru întrebări comerciale, juridice sau operaționale legate de acești termeni, ne poți scrie la ${CONTACT_EMAIL}.`,
      "Continuarea utilizării produsului după publicarea unei versiuni actualizate a termenilor reprezintă acceptarea versiunii noi, în măsura permisă de lege."
    ]
  }
] as const;

export default function Page() {
  return (
    <LegalPage
      eyebrow="Termeni"
      title="Termeni și condiții"
      intro="Aceste condiții guvernează utilizarea site-ului și a platformei OcupaLoc. Ele explică responsabilitățile principale, limitele serviciului și regulile de utilizare acceptată."
      lastUpdated="26 aprilie 2026"
      sections={sections}
    />
  );
}
