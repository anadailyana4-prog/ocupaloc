import type { Metadata } from "next";

import { VerticalBookingPage } from "@/components/seo/VerticalBookingPage";

export const metadata: Metadata = {
  title: "Programări Online Tatuaje | Software Salon Tatuaje | 59,99 RON",
  description:
    "Software de programări online pentru salon de tatuaje și piercing: agendă clară, acont online, fără comision. Preț fix 59,99 RON/lună, setup în câteva minute.",
  keywords: [
    "programari online tatuaje",
    "software salon tatuaje",
    "aplicatie programari tatuaje",
    "programari online tattoo",
    "agenda online salon tatuaje"
  ],
  alternates: { canonical: "https://ocupaloc.ro/programari-online-tatuaje" },
  openGraph: {
    title: "Programări Online Tatuaje | OcupaLoc",
    description: "Software pentru salon de tatuaje, fără comision, 59,99 RON/lună.",
    url: "https://ocupaloc.ro/programari-online-tatuaje",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Programări Online Tatuaje | OcupaLoc",
    description: "Software pentru salon de tatuaje, fără comision, 59,99 RON/lună."
  }
};

export default function ProgramariOnlineTatuajePage() {
  return (
    <VerticalBookingPage
      slug="programari-online-tatuaje"
      breadcrumbLabel="Programări online tatuaje"
      ctaLocationPrefix="seo_tatuaje"
      h1="Programări online pentru salon de tatuaje"
      intro="OcupaLoc este software-ul de programări online prin care clienții îți rezervă singuri ședința de tatuaj, fără schimburi nesfârșite de mesaje. Agendă clară pentru fiecare artist, fără comision, la 59,99 RON pe lună."
      sectionTitle="De ce un salon de tatuaje are nevoie de programări online"
      paragraphs={[
        "Într-un salon de tatuaje, fiecare proiect este diferit. Un design mic durează o oră, în timp ce o piesă mare poate ocupa o zi întreagă sau mai multe ședințe. Când totul se negociază prin DM-uri pe Instagram, artistul pierde ore întregi răspunzând la întrebări și jonglând cu disponibilitatea. Programările online pun ordine: clientul vede tipurile de ședință, durata estimată și orele libere, apoi confirmă singur intervalul.",
        "Cel mai mare avantaj este filtrarea cererilor serioase. Mulți artiști primesc zilnic mesaje vagi care nu se transformă niciodată în programări. Cu un flux clar de rezervare, clientul care chiar vrea o ședință trece printr-un proces simplu și ajunge direct în agendă. Pentru tine, asta înseamnă mai puțin timp pierdut și mai mult timp efectiv de lucru pe piele.",
        "Setarea corectă a duratelor este esențială în acest domeniu. Poți defini tipuri diferite de servicii — consultație și schiță, ședință scurtă, ședință lungă sau retuș — fiecare cu durata proprie. Astfel, intervalele propuse clienților sunt realiste, iar artiștii nu se trezesc cu programări care se suprapun sau cu pauze prost calculate între proiecte mari.",
        "Disponibilitatea non-stop ajută și aici. Clienții se decid adesea seara, când au timp să caute referințe și să-și aleagă designul. Dacă singura cale de rezervare este să-ți scrie și să aștepte răspuns, mulți renunță sau aleg alt artist. Un link public de programare, pus în bio Instagram și pe TikTok, transformă acel interes de moment într-o rezervare reală.",
        "În final, modelul fără comision contează enorm pentru un salon de tatuaje, unde valoarea unei ședințe este mare. O platformă care îți ia un procent din fiecare client te costă semnificativ pe an. Cu OcupaLoc plătești 59,99 RON fix pe lună și păstrezi tot ce încasezi, indiferent câte proiecte programezi."
      ]}
      benefits={[
        { title: "Agendă pe fiecare artist", text: "Organizezi programul fiecărui tatuator și eviți suprapunerile dintre proiecte scurte și ședințe lungi." },
        { title: "Cereri filtrate", text: "Clienții serioși trec printr-un flux clar de rezervare, nu prin zeci de mesaje vagi." },
        { title: "Durate realiste", text: "Setezi consultație, ședință scurtă, ședință lungă sau retuș, fiecare cu durata proprie." },
        { title: "Rezervări 24/7", text: "Clienții rezervă seara sau în weekend, exact când își aleg designul, fără să aștepte un răspuns." },
        { title: "Fără comision", text: "Preț fix 59,99 RON pe lună. Păstrezi tot ce încasezi, indiferent de valoarea ședinței." },
        { title: "Link de pus în bio", text: "Un link curat de programare pe care îl distribui pe Instagram și TikTok." }
      ]}
      faqItems={[
        { question: "Pot gestiona mai mulți artiști în același salon?", answer: "Da. Poți organiza serviciile și programul astfel încât fiecare artist să aibă agenda lui clară și să eviți suprapunerile." },
        { question: "Pot seta durate diferite pentru ședințe?", answer: "Da. Fiecare tip de ședință — de la consultație și schiță până la o piesă mare — poate avea durata și prețul propriu, ca intervalele oferite să fie realiste." },
        { question: "Cum reduc mesajele care nu se transformă în programări?", answer: "Pui link-ul de rezervare în bio, iar clienții serioși îl folosesc direct. Așa filtrezi cererile vagi și ajungi mai repede la programări concrete." },
        { question: "Există comision pe programare?", answer: "Nu. Prețul este fix, 59,99 RON pe lună, fără comision și fără costuri ascunse, indiferent câte ședințe programezi." },
        { question: "Cât durează să configurez salonul?", answer: "Câteva minute. Adaugi serviciile cu durată și preț, setezi programul și primești un link public de programare." }
      ]}
      relatedLinks={[
        { href: "/programari-online-makeup", label: "Programări online make-up" },
        { href: "/aplicatie-programari-frizerie", label: "Aplicație programări frizerie" },
        { href: "/aplicatie-programari-salon", label: "Aplicație programări salon" },
        { href: "/preturi", label: "Prețuri OcupaLoc" }
      ]}
    />
  );
}
