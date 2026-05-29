import type { Metadata } from "next";

import { VerticalBookingPage } from "@/components/seo/VerticalBookingPage";

export const metadata: Metadata = {
  title: "Programări Online Veterinar | Software Cabinet Veterinar | 59,99 RON",
  description:
    "Software de programări online pentru cabinet veterinar: consultații, vaccinări și controale, cu reamintiri automate, fără comision. Preț fix 59,99 RON/lună.",
  keywords: [
    "programari online veterinar",
    "software cabinet veterinar",
    "programari online cabinet veterinar",
    "aplicatie programari veterinar",
    "agenda online clinica veterinara"
  ],
  alternates: { canonical: "https://ocupaloc.ro/programari-online-veterinar" },
  openGraph: {
    title: "Programări Online Veterinar | OcupaLoc",
    description: "Software pentru cabinet veterinar, fără comision, 59,99 RON/lună.",
    url: "https://ocupaloc.ro/programari-online-veterinar",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Programări Online Veterinar | OcupaLoc",
    description: "Software pentru cabinet veterinar, fără comision, 59,99 RON/lună."
  }
};

export default function ProgramariOnlineVeterinarPage() {
  return (
    <VerticalBookingPage
      slug="programari-online-veterinar"
      breadcrumbLabel="Programări online veterinar"
      ctaLocationPrefix="seo_veterinar"
      h1="Programări online pentru cabinet veterinar"
      intro="OcupaLoc este software-ul de programări online prin care stăpânii de animale rezervă singuri consultația, vaccinarea sau controlul. Agendă clară, reamintiri automate, fără comision, la 59,99 RON pe lună."
      sectionTitle="De ce un cabinet veterinar are nevoie de programări online"
      paragraphs={[
        "Într-un cabinet veterinar, ziua alternează între consultații programate și urgențe. Când rezervările de rutină vin doar prin telefon, recepția se aglomerează exact când medicul are nevoie de liniște pentru un caz dificil. Programările online preiau partea previzibilă a agendei: stăpânul alege tipul de vizită, vede orele libere și confirmă singur, lăsând telefonul liber pentru cazurile care chiar au nevoie de el.",
        "Cel mai mare avantaj este reducerea neprezentărilor și a controalelor uitate. Multe vizite veterinare sunt recurente — vaccinări anuale, deparazitări, controale post-operatorii. Reamintirile automate trimise înainte de programare îi ajută pe stăpâni să nu uite, ceea ce înseamnă animale mai sănătoase și o agendă mai bine completată pentru cabinet.",
        "Setarea duratelor pe tip de vizită ajută la organizarea zilei. O consultație simplă durează puțin, în timp ce o intervenție sau o evaluare amănunțită ocupă mai mult timp. Când fiecare serviciu are durata proprie, intervalele propuse sunt realiste, iar medicul nu se trezește cu programări care se suprapun peste cazuri complexe.",
        "Disponibilitatea non-stop ajută stăpânii ocupați. Mulți decid seara, după ce ajung acasă, că animalul lor are nevoie de un control. Dacă singura cale e telefonul în orele de program, amână sau uită. Un link public de programare, pus pe site și pe Google, transformă acel moment în rezervare imediată.",
        "Modelul fără comision aduce predictibilitate. Pentru un cabinet cu volum constant de pacienți, o taxă pe fiecare programare s-ar aduna rapid. Cu OcupaLoc plătești 59,99 RON fix pe lună, indiferent câte vizite programezi, iar resursele rămase le investești în aparatură și în echipă."
      ]}
      benefits={[
        { title: "Telefon liber pentru urgențe", text: "Vizitele de rutină se rezervă online, iar telefonul rămâne disponibil pentru cazurile urgente." },
        { title: "Controale care nu se uită", text: "Reamintirile automate îi ajută pe stăpâni să respecte vaccinările și controalele recurente." },
        { title: "Durate pe tip de vizită", text: "Setezi consultație, vaccinare sau evaluare amănunțită, fiecare cu durata proprie." },
        { title: "Rezervări 24/7", text: "Stăpânii rezervă seara, când ajung acasă, fără să aștepte orele de program." },
        { title: "Fără comision", text: "Preț fix 59,99 RON pe lună, indiferent de numărul de programări." },
        { title: "Recepție degrevată", text: "Mai puține apeluri de rutină și mai mult timp pentru pacientul din cabinet." }
      ]}
      faqItems={[
        { question: "Pot separa consultațiile de rutină de urgențe?", answer: "Da. Vizitele programabile se rezervă online, iar telefonul rămâne liber pentru urgențele care nu pot fi planificate." },
        { question: "Pot seta durate diferite pe tip de vizită?", answer: "Da. Fiecare serviciu — de la consultație la evaluare amănunțită — are durata și prețul propriu, astfel încât intervalele să fie realiste." },
        { question: "Cum ajut stăpânii să nu uite controalele?", answer: "Reamintirile automate trimise înainte de programare reduc vizitele uitate, inclusiv vaccinările și controalele recurente." },
        { question: "Există comision pe programare?", answer: "Nu. Prețul este fix, 59,99 RON pe lună, fără comision și fără costuri ascunse." },
        { question: "Cât durează configurarea cabinetului?", answer: "Câteva minute. Adaugi serviciile cu durată și preț, setezi programul și primești un link public de programare." }
      ]}
      relatedLinks={[
        { href: "/software-programari-clinica", label: "Software programări clinică" },
        { href: "/programari-online-stomatologie", label: "Programări online stomatologie" },
        { href: "/programari-online-kinetoterapie", label: "Programări online kinetoterapie" },
        { href: "/preturi", label: "Prețuri OcupaLoc" }
      ]}
    />
  );
}
