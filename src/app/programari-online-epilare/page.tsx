import type { Metadata } from "next";

import { VerticalBookingPage } from "@/components/seo/VerticalBookingPage";

export const metadata: Metadata = {
  title: "Programări Online Epilare Definitivă | Software Salon | 59,99 RON",
  description:
    "Software de programări online pentru salon de epilare definitivă și laser: agendă pe ședințe, reamintiri automate, fără comision. Preț fix 59,99 RON/lună.",
  keywords: [
    "programari online epilare",
    "programari online epilare definitiva",
    "software salon epilare",
    "aplicatie programari epilare laser",
    "agenda online epilare"
  ],
  alternates: { canonical: "https://ocupaloc.ro/programari-online-epilare" },
  openGraph: {
    title: "Programări Online Epilare | OcupaLoc",
    description: "Software pentru salon de epilare, fără comision, 59,99 RON/lună.",
    url: "https://ocupaloc.ro/programari-online-epilare",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Programări Online Epilare | OcupaLoc",
    description: "Software pentru salon de epilare, fără comision, 59,99 RON/lună."
  }
};

export default function ProgramariOnlineEpilarePage() {
  return (
    <VerticalBookingPage
      slug="programari-online-epilare"
      breadcrumbLabel="Programări online epilare"
      ctaLocationPrefix="seo_epilare"
      h1="Programări online pentru salon de epilare definitivă"
      intro="OcupaLoc este software-ul de programări online prin care clienții își rezervă singuri ședințele de epilare definitivă sau laser. Agendă clară pe zone și ședințe, reamintiri automate, fără comision, la 59,99 RON pe lună."
      sectionTitle="De ce un salon de epilare are nevoie de programări online"
      paragraphs={[
        "Epilarea definitivă funcționează pe ședințe repetate, la intervale regulate. Asta înseamnă că o clientă nu vine o singură dată, ci revine de mai multe ori, pe parcursul mai multor luni. Gestionarea acestor reveniri prin telefon și mesaje devine rapid haotică: cine la ce ședință e, când urmează următoarea, ce zonă a făcut data trecută. Programările online aduc claritate, pentru că fiecare client își vede serviciul, durata și orele disponibile.",
        "Cel mai mare câștig este continuitatea programului de tratament. Reamintirile automate înainte de fiecare ședință scad numărul clientelor care uită sau amână, ceea ce e crucial când rezultatul depinde de respectarea intervalelor dintre ședințe. O agendă bine ținută înseamnă clienți mulțumiți care văd rezultate și revin pentru pachetul complet.",
        "Setarea corectă a duratelor pe zonă face diferența. Epilarea axilelor durează puțin, în timp ce picioarele complete ocupă mult mai mult timp. Când fiecare serviciu are durata proprie, intervalele propuse sunt realiste și nu apar întârzieri în lanț. Pentru un salon cu aparatură scumpă, fiecare slot bine folosit contează direct în rentabilitate.",
        "Disponibilitatea non-stop ajută la umplerea agendei. Clientele caută adesea seara sau în pauza de la birou să-și prindă următoarea ședință. Dacă singura cale e telefonul în orele de program, pierzi rezervări. Cu un link public, salonul tău primește programări la orice oră, fără să blochezi recepția.",
        "Modelul fără comision păstrează marja sănătoasă. Investiția într-un aparat de epilare definitivă este mare, iar fiecare ședință trebuie să contribuie la recuperarea ei. O platformă care îți ia un procent pe fiecare client îți reduce câștigul exact când ai mai mult volum. Cu OcupaLoc plătești 59,99 RON fix pe lună și păstrezi tot ce încasezi."
      ]}
      benefits={[
        { title: "Ședințe recurente clare", text: "Vezi ușor cine urmează și păstrezi continuitatea programului de tratament pentru fiecare client." },
        { title: "Reamintiri automate", text: "Clientele primesc reamintiri înainte de ședință, esențial pentru respectarea intervalelor dintre tratamente." },
        { title: "Durate pe zonă", text: "Setezi durate diferite pentru axile, picioare sau corp complet, ca agenda să fie realistă." },
        { title: "Rezervări 24/7", text: "Clientele își prind următoarea ședință seara sau în pauză, fără să sune salonul." },
        { title: "Fără comision", text: "Preț fix 59,99 RON pe lună. Marjă sănătoasă pentru a recupera investiția în aparatură." },
        { title: "Link de pus în bio", text: "Un link curat de programare pentru Instagram, Google și WhatsApp." }
      ]}
      faqItems={[
        { question: "Pot gestiona ședințe recurente pentru aceeași clientă?", answer: "Da. Fiecare clientă își rezervă următoarea ședință din linkul public, iar tu vezi clar agenda pe zile și servicii." },
        { question: "Pot seta durate diferite pentru fiecare zonă?", answer: "Da. Fiecare serviciu — de la axile la corp complet — are durata și prețul propriu, astfel încât intervalele oferite să fie realiste." },
        { question: "Cum reduc clientele care uită de ședință?", answer: "Reamintirile automate trimise înainte de programare scad semnificativ neprezentările, ceea ce ajută la respectarea intervalelor de tratament." },
        { question: "Există comision pe programare?", answer: "Nu. Prețul este fix, 59,99 RON pe lună, fără comision și fără costuri ascunse." },
        { question: "Cât durează configurarea salonului?", answer: "Câteva minute. Adaugi serviciile cu durată și preț, setezi programul și primești un link public de programare." }
      ]}
      relatedLinks={[
        { href: "/programari-online-cosmetica", label: "Programări online cosmetică" },
        { href: "/software-programari-manichiura", label: "Software programări manichiură" },
        { href: "/aplicatie-programari-salon", label: "Aplicație programări salon" },
        { href: "/preturi", label: "Prețuri OcupaLoc" }
      ]}
    />
  );
}
