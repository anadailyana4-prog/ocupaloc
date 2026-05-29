import type { Metadata } from "next";

import { VerticalBookingPage } from "@/components/seo/VerticalBookingPage";

export const metadata: Metadata = {
  title: "Programări Online Kinetoterapie | Software Cabinet Recuperare | 59,99 RON",
  description:
    "Software de programări online pentru cabinet de kinetoterapie și recuperare medicală: ședințe recurente, reamintiri automate, fără comision. 59,99 RON/lună.",
  keywords: [
    "programari online kinetoterapie",
    "software cabinet kinetoterapie",
    "programari online recuperare medicala",
    "aplicatie programari kinetoterapeut",
    "agenda online kinetoterapie"
  ],
  alternates: { canonical: "https://ocupaloc.ro/programari-online-kinetoterapie" },
  openGraph: {
    title: "Programări Online Kinetoterapie | OcupaLoc",
    description: "Software pentru cabinet de kinetoterapie, fără comision, 59,99 RON/lună.",
    url: "https://ocupaloc.ro/programari-online-kinetoterapie",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Programări Online Kinetoterapie | OcupaLoc",
    description: "Software pentru cabinet de kinetoterapie, fără comision, 59,99 RON/lună."
  }
};

export default function ProgramariOnlineKinetoterapiePage() {
  return (
    <VerticalBookingPage
      slug="programari-online-kinetoterapie"
      breadcrumbLabel="Programări online kinetoterapie"
      ctaLocationPrefix="seo_kineto"
      h1="Programări online pentru cabinet de kinetoterapie"
      intro="OcupaLoc este software-ul de programări online prin care pacienții își rezervă singuri ședințele de kinetoterapie și recuperare. Agendă clară pe ședințe recurente, reamintiri automate, fără comision, la 59,99 RON pe lună."
      sectionTitle="De ce un cabinet de kinetoterapie are nevoie de programări online"
      paragraphs={[
        "Recuperarea medicală se bazează pe ședințe repetate, în serie. Un pacient nu vine o singură dată, ci urmează un program de mai multe ședințe, adesea la zile fixe. Gestionarea acestor reveniri prin telefon devine greoaie: trebuie să ții minte cine la ce etapă e și să eviți golurile în agendă. Programările online structurează totul — pacientul vede serviciile, durata și orele libere și își rezervă singur ședințele.",
        "Cel mai mare avantaj este continuitatea tratamentului. Reamintirile automate trimise înainte de fiecare ședință reduc neprezentările, ceea ce este esențial când rezultatul depinde de respectarea ritmului recomandat de specialist. O agendă bine ținută înseamnă pacienți care își duc programul la capăt și văd progres real.",
        "Setarea corectă a duratelor ajută kinetoterapeutul să-și planifice ziua. O evaluare inițială durează mai mult decât o ședință de menținere. Când fiecare serviciu are durata proprie, intervalele propuse sunt realiste, iar tu ai timp suficient între pacienți, fără să te grăbești sau să întârzii programările următoare.",
        "Disponibilitatea non-stop degrevează cabinetul. Pacienții pot să-și prindă următoarea ședință seara sau în pauza de la birou, fără să sune în orele de program. Un link public de rezervare înseamnă mai puține apeluri de gestionat și mai mult timp dedicat tratamentului efectiv.",
        "Modelul fără comision oferă predictibilitate financiară. Pentru un cabinet care lucrează cu volum constant de pacienți, o taxă pe fiecare programare s-ar aduna rapid. Cu OcupaLoc plătești 59,99 RON fix pe lună, indiferent câte ședințe programezi, iar banii rămași îi investești în aparatură și în dezvoltarea cabinetului."
      ]}
      benefits={[
        { title: "Ședințe în serie clare", text: "Pacienții își rezervă ședințele recurente, iar tu păstrezi continuitatea programului de recuperare." },
        { title: "Reamintiri automate", text: "Pacienții primesc reamintiri înainte de ședință, esențial pentru respectarea ritmului de tratament." },
        { title: "Durate pe tip de ședință", text: "Setezi evaluare inițială sau ședință de menținere, fiecare cu durata proprie." },
        { title: "Rezervări 24/7", text: "Pacienții își prind următoarea ședință seara sau în pauză, fără să sune cabinetul." },
        { title: "Fără comision", text: "Preț fix 59,99 RON pe lună, indiferent de numărul de ședințe programate." },
        { title: "Recepție degrevată", text: "Mai puține apeluri de gestionat și mai mult timp pentru pacientul de pe masă." }
      ]}
      faqItems={[
        { question: "Pot gestiona ședințe recurente pentru același pacient?", answer: "Da. Pacientul își rezervă ședințele din linkul public, iar tu vezi clar agenda pe zile și servicii, fără să pierzi evidența seriei de tratament." },
        { question: "Pot seta durate diferite pentru evaluare și ședințe?", answer: "Da. Fiecare serviciu — de la evaluarea inițială la ședința de menținere — are durata și prețul propriu, ca intervalele oferite să fie realiste." },
        { question: "Cum reduc neprezentările?", answer: "Reamintirile automate trimise înainte de programare scad semnificativ pacienții care uită sau întârzie." },
        { question: "Există comision pe programare?", answer: "Nu. Prețul este fix, 59,99 RON pe lună, fără comision și fără costuri ascunse." },
        { question: "Cât durează configurarea cabinetului?", answer: "Câteva minute. Adaugi serviciile cu durată și preț, setezi programul și primești un link public de programare." }
      ]}
      relatedLinks={[
        { href: "/software-programari-clinica", label: "Software programări clinică" },
        { href: "/programari-online-stomatologie", label: "Programări online stomatologie" },
        { href: "/programari-online-spa-masaj", label: "Programări online spa & masaj" },
        { href: "/preturi", label: "Prețuri OcupaLoc" }
      ]}
    />
  );
}
