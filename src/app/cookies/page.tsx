import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { SUPPORT_EMAIL } from "@/config/marketing";

export const metadata: Metadata = {
  title: "Politica de cookies",
  description: "Ce fișiere cookie folosește ocupaloc.ro și cum le poți controla."
};

export default function CookiesPage() {
  return (
    <LegalPageShell title="Politica de cookies" updated="16 aprilie 2026">
      <p>
        Acest site poate folosi cookie-uri și tehnologii similare pentru funcționare, securitate și măsurare. Continuarea navigării implică înțelegerea acestei politici; pentru cookie-uri neesențiale (ex. analitică), vom căuta să le activăm doar cu consimțământ acolo unde legea o cere.
      </p>

      <h2>1. Ce sunt cookie-urile?</h2>
      <p>Sunt fișiere mici stocate pe dispozitivul tău care permit recunoașterea sesiunii sau îmbunătățirea experienței.</p>

      <h2>2. Tipuri utilizate</h2>
      <ul>
        <li>
          <strong>Esențiale / de sesiune:</strong> necesare autentificării și menținerii stării contului în aplicație.
        </li>
        <li>
          <strong>Analitică (opțional):</strong> dacă activezi Google Analytics (sau echivalent) prin variabila de mediu din producție, pot fi folosite cookie-uri de măsurare a traficului — verifică banner-ul de cookies dacă este afișat.
        </li>
        <li>
          <strong>Preferințe:</strong> stocarea limbii sau setărilor UI unde este cazul.
        </li>
      </ul>

      <h2>3. Control</h2>
      <p>
        Poți șterge sau bloca cookie-urile din setările browserului. Reține că dezactivarea cookie-urilor esențiale poate împiedica login-ul sau funcții critice ale platformei.
      </p>

      <h2>4. Contact</h2>
      <p>
        Întrebări:{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-400 hover:text-indigo-300">
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    </LegalPageShell>
  );
}
