import type { Metadata } from "next";

import { VerticalBookingPage } from "@/components/seo/VerticalBookingPage";

export const metadata: Metadata = {
  title: "Programări Online Make-up | Software Makeup Artist | 59,99 RON",
  description:
    "Software de programări online pentru makeup artist: rezervări pentru machiaj de zi, eveniment sau mireasă, fără comision. Preț fix 59,99 RON/lună.",
  keywords: [
    "programari online makeup",
    "programari online make-up",
    "software makeup artist",
    "aplicatie programari machiaj",
    "agenda online makeup artist"
  ],
  alternates: { canonical: "https://ocupaloc.ro/programari-online-makeup" },
  openGraph: {
    title: "Programări Online Make-up | OcupaLoc",
    description: "Software pentru makeup artist, fără comision, 59,99 RON/lună.",
    url: "https://ocupaloc.ro/programari-online-makeup",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Programări Online Make-up | OcupaLoc",
    description: "Software pentru makeup artist, fără comision, 59,99 RON/lună."
  }
};

export default function ProgramariOnlineMakeupPage() {
  return (
    <VerticalBookingPage
      slug="programari-online-makeup"
      breadcrumbLabel="Programări online make-up"
      ctaLocationPrefix="seo_makeup"
      h1="Programări online pentru makeup artist"
      intro="OcupaLoc este software-ul de programări online prin care clientele îți rezervă singure ședința de machiaj — de zi, de eveniment sau de mireasă. Agendă clară, durate corecte per serviciu, fără comision, la 59,99 RON pe lună."
      sectionTitle="De ce un makeup artist are nevoie de programări online"
      paragraphs={[
        "Pentru un makeup artist, agenda se construiește în jurul evenimentelor. O machiere de zi durează mai puțin, una de eveniment ceva mai mult, iar machiajul de mireasă presupune adesea o probă și ședința din ziua nunții. Când totul se negociază prin DM-uri pe Instagram, riști să pierzi detalii și să suprapui programări importante. Programările online structurează totul: clienta alege tipul de serviciu, vede durata și orele libere și confirmă pe loc.",
        "Cel mai mare avantaj este claritatea pentru evenimente cu mize mari. La un machiaj de mireasă nu îți permiți confuzii de oră sau dublă rezervare. Cu o agendă digitală, fiecare slot rezervat este clar, iar reamintirile automate reduc riscul de neînțelegeri. Clienta primește confirmare și știe exact când și unde are loc ședința.",
        "Setarea duratelor pe tip de serviciu face ziua predictibilă. Poți defini machiaj de zi, machiaj de seară, machiaj de eveniment și pachet de mireasă cu probă, fiecare cu durata proprie. Astfel, intervalele propuse sunt realiste și ai timp suficient între cliente, mai ales în sezonul de nunți, când cererea explodează.",
        "Disponibilitatea non-stop ajută la conversie. Multe cliente caută un makeup artist seara, când planifică evenimentul. Dacă trebuie să-ți scrie și să aștepte răspuns, riști să aleagă pe altcineva care răspunde mai repede. Un link public de programare, pus în bio Instagram, transformă acel interes în rezervare imediată, chiar și când tu ești ocupată cu o altă clientă.",
        "Modelul fără comision contează pentru un artist independent. Valoarea unei ședințe, mai ales de mireasă, este mare, iar o platformă care îți ia un procent din fiecare client te costă mult pe an. Cu OcupaLoc plătești 59,99 RON fix pe lună și păstrezi tot ce încasezi, indiferent de câte evenimente programezi."
      ]}
      benefits={[
        { title: "Agendă pe evenimente", text: "Organizezi machiajele de zi, eveniment și mireasă fără să suprapui programări importante." },
        { title: "Zero confuzii la nunți", text: "Fiecare slot rezervat este clar, iar reamintirile reduc neînțelegerile la evenimente cu mize mari." },
        { title: "Durate pe serviciu", text: "Setezi machiaj de zi, de seară, de eveniment sau pachet de mireasă cu probă, fiecare cu durata proprie." },
        { title: "Rezervări 24/7", text: "Clientele rezervă seara, când planifică evenimentul, fără să aștepte un răspuns la mesaj." },
        { title: "Fără comision", text: "Preț fix 59,99 RON pe lună. Păstrezi tot ce încasezi, inclusiv la pachetele de mireasă." },
        { title: "Link de pus în bio", text: "Un link curat de programare pentru Instagram și WhatsApp." }
      ]}
      faqItems={[
        { question: "Pot gestiona machiaj de mireasă cu probă și ședință separată?", answer: "Da. Poți crea servicii distincte cu durate proprii, inclusiv un pachet care include proba și ședința din ziua evenimentului." },
        { question: "Cum evit dubla rezervare la evenimente?", answer: "Clientele văd doar orele realmente libere, iar slotul rezervat dispare automat din disponibilitate, deci nu apar suprapuneri." },
        { question: "Pot seta durate diferite pe tip de machiaj?", answer: "Da. Fiecare serviciu, de la machiaj de zi la pachet de mireasă, are durata și prețul propriu." },
        { question: "Există comision pe programare?", answer: "Nu. Prețul este fix, 59,99 RON pe lună, fără comision și fără costuri ascunse." },
        { question: "Cât durează configurarea?", answer: "Câteva minute. Adaugi serviciile cu durată și preț, setezi programul și primești un link public de programare." }
      ]}
      relatedLinks={[
        { href: "/programari-online-cosmetica", label: "Programări online cosmetică" },
        { href: "/programari-online-coafor", label: "Programări online coafor" },
        { href: "/programari-online-tatuaje", label: "Programări online tatuaje" },
        { href: "/preturi", label: "Prețuri OcupaLoc" }
      ]}
    />
  );
}
