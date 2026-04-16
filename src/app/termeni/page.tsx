import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { MONTHLY_PRICE_LABEL, SUPPORT_EMAIL, TRIAL_DAYS } from "@/config/marketing";

export const metadata: Metadata = {
  title: "Termeni și condiții",
  description: "Condiții de utilizare Ocupaloc — abonament, perioadă de probă, obligațiile utilizatorilor."
};

export default function TermeniPage() {
  return (
    <LegalPageShell title="Termeni și condiții de utilizare" updated="16 aprilie 2026">
      <p>
        Prezentul document reglementează utilizarea platformei <strong>Ocupaloc</strong> (denumire comercială), disponibilă la adresa{" "}
        <Link href="https://ocupaloc.ro" className="text-indigo-400 hover:text-indigo-300">
          ocupaloc.ro
        </Link>
        . Prin crearea unui cont și utilizarea serviciului, ești de acord cu acești termeni. Dacă nu ești de acord, te rugăm să nu folosești platforma.
      </p>

      <h2>1. Descrierea serviciului</h2>
      <p>
        Ocupaloc este un serviciu software (SaaS) care permite profesioniștilor din domeniul beauty și servicii similare să gestioneze programări online, să afișeze un link public de rezervare și să își administreze disponibilitatea și serviciile.
      </p>

      <h2>2. Cont și eligibilitate</h2>
      <p>
        Ești responsabil pentru exactitatea datelor furnizate la înregistrare și pentru păstrarea confidențialității autentificării. Nu transmite contul tău altor persoane. Ne rezervăm dreptul de a suspenda conturi folosite în mod abuziv sau care încalcă legislația aplicabilă din România sau UE.
      </p>

      <h2>3. Abonament, perioadă de probă și plată</h2>
      <p>
        La momentul redactării acestui document se poate oferi o perioadă de probă de <strong>{TRIAL_DAYS} zile</strong> după înregistrare, conform comunicărilor din aplicație. După perioada de probă, utilizarea serviciului se facturează ca abonament lunar, în prezent la{" "}
        <strong>
          {MONTHLY_PRICE_LABEL} RON/lună (TVA inclus)
        </strong>
        , pentru o locație, cu posibilitate de modificare a prețului cu notificare prealabilă rezonabilă (de exemplu prin e-mail și mesaj în cont).
      </p>
      <p>
        Facturarea și metodele de plată disponibile vor fi indicate clar în cont când activarea plătită devine operațională. Neplată în termen poate duce la suspendarea accesului până la regularizare.
      </p>

      <h2>4. Reziliere</h2>
      <p>
        Poți renunța la abonament conform opțiunilor din cont / comunicărilor din aplicație. Ne păstrăm dreptul de a încheia accesul în caz de încălcare gravă a acestor termeni, cu notificare unde este legal posibil.
      </p>

      <h2>5. Conținut și date</h2>
      <p>
        Ești responsabil pentru datele pe care le introduci despre business-ul tău și clienți, și pentru respectarea GDPR și a legislației privind protecția consumatorilor. Nu ne trimite și nu încerca să stochezi prin platformă informații inutile sau ilegale.
      </p>

      <h2>6. Limitarea răspunderii</h2>
      <p>
        Serviciul este oferit „ca atare”. În măsura permisă de lege, nu suntem răspunzători pentru pierderi indirecte, pierderi de profituri sau întreruperi cauzate de factori în afara controlului rezonabil (inclusiv indisponibilitate internet, acțiuni ale terților cum ar fi furnizorii de hosting sau integrări externe).
      </p>

      <h2>7. Modificări</h2>
      <p>
        Putem actualiza acești termeni. Versiunea aplicabilă este cea publicată pe site, cu data ultimei actualizări. Continuarea utilizării după modificări poate constitui acceptarea lor — vom căuta să semnalizăm modificările esențiale.
      </p>

      <h2>8. Contact</h2>
      <p>
        Pentru întrebări legate de termeni:{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-400 hover:text-indigo-300">
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    </LegalPageShell>
  );
}
