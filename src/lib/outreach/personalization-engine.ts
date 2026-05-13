import { personalizationInputSchema } from "@/lib/outreach/ops-schemas";
import type { PersonalizationInput } from "@/lib/outreach/ops-schemas";

interface PersonalizationOutput {
  subject: string;
  text: string;
  html: string;
  followUpSubject: string;
  followUpText: string;
  followUpHtml: string;
  followUp2Subject: string;
  followUp2Text: string;
  followUp2Html: string;
  breakUpSubject: string;
  breakUpText: string;
  breakUpHtml: string;
  reactivationSubject: string;
  reactivationText: string;
  reactivationHtml: string;
}

const OCUPALOC_SITE_URL = "https://ocupaloc.ro";

const NICHE_COPY: Record<string, { label: string; problem: string; benefit: string; cta: string }> = {
  barber: {
    label: "barbershop",
    problem: "cand programarile vin prin telefon sau Instagram, se pierd usor ore si confirmari",
    benefit: "o pagina simpla de programari poate muta rapid rezervarile repetitive din mesaje in online",
    cta: "Daca vrei, iti trimit un exemplu foarte scurt aplicat pe un barber shop din orasul tau."
  },
  frizerii: {
    label: "frizerie",
    problem: "orele aglomerate si confirmarile manuale consuma timp exact cand echipa ar trebui sa lucreze cu clientii",
    benefit: "programarile online si reminder-ele automate reduc frictiunea din ziua de lucru",
    cta: "Daca are sens, iti arat in 10 minute cum poate arata fluxul pentru frizeria voastra."
  },
  saloane: {
    label: "salon",
    problem: "cand serviciile si disponibilitatea nu sunt clare online, o parte din clienti abandoneaza inainte sa sune",
    benefit: "un flux simplu de rezervare ajuta mai ales la servicii recurente si confirmari",
    cta: "Daca vrei, iti trimit un exemplu concret pentru saloane din aceeasi zona."
  },
  "beauty-independent": {
    label: "servicii de beauty independente (ex. manichiura)",
    problem: "din mesajele de WhatsApp, apeluri, SMS si Instagram reiese rapid ca organizarea se face manual — clientele trebuie confirmate, reschedule-urile se pierd, orele se dublează",
    benefit: "cu o pagina simpla de programare online, elimini cea mai mare parte din munca asta si clientele se pot reschedula singure, fara sa-ti scrie mesaje",
    cta: "Pot sa-ti arat cum arata fluxul in 5 minute — cred ca te-ar ajuta."
  },
  "clinici-estetice": {
    label: "clinica estetica",
    problem: "solicitarile initiale se strang in prea multe canale, iar trierea devine greoaie",
    benefit: "un formular si un flux de programare bine asezate pot filtra mai bine cererile utile",
    cta: "Daca e relevant, iti trimit un exemplu sobru pentru o clinica din Romania."
  },
  dentisti: {
    label: "cabinet stomatologic",
    problem: "pacientii care suna si nu gasesc direct un slot liber renunta sau apeleaza la concurenta",
    benefit: "un sistem de programari online cu reminder automat reduce no-show-urile si usureaza receptia",
    cta: "Daca vrei sa vad cum ar putea arata fluxul pentru cabinetul tau, ti-l trimit intr-un email scurt."
  },
  fizioterapie: {
    label: "cabinet de fizioterapie",
    problem: "sedintele recurente si confirmarile telefonice consuma timp din programul terapeutilor",
    benefit: "o pagina de programari online cu confirmare automata poate prelua tot ce se face acum manual",
    cta: "Daca are sens pentru cabinetul tau, iti trimit un exemplu in cateva minute."
  },
  masaj: {
    label: "salon de masaj",
    problem: "clientii revin des, dar confirmarile si reprogramarile manuale creeaza frecare inutila",
    benefit: "programarile online cu reminder reduc anularile de ultima ora si fidelizeaza mai bine clientii existenti",
    cta: "Daca vrei sa vedem cum functioneaza pentru saloanele de masaj, iti trimit direct un exemplu."
  },
  spa: {
    label: "spa",
    problem: "rezervarile de pachete si confirmarile de grup ajung pe telefon si email deodată",
    benefit: "un flux centralizat de programari reduce confuzia si imbunatateste experienta clientului inca de la prima interactiune",
    cta: "Iti pot trimite un exemplu aplicat pentru spa-uri daca e de interes."
  },
  psihologi: {
    label: "cabinet de psihologie",
    problem: "sedintele de terapie necesita un proces discret si simplu de programare, greu de gestionat manual",
    benefit: "un sistem de programari online discret si fara friction reduce bariera pentru noi clienti",
    cta: "Daca e potrivit pentru cabinetul tau, iti arat intr-un email scurt cum poate arata fluxul."
  },
  nutritionisti: {
    label: "cabinet de nutritie",
    problem: "consultatiile initiale si follow-up-urile se pierd in mesaje si apeluri nesistematizate",
    benefit: "o pagina de programari clara reduce efortul initial al clientului si iti elibereaza timp",
    cta: "Daca are sens, iti trimit un exemplu pentru cabinete de nutritie din Romania."
  },
  fitness: {
    label: "sala de fitness / yoga",
    problem: "clasele si sedintele individuale necesita confirmare manuala, mai ales cand cererea fluctueaza",
    benefit: "un sistem de rezervari pentru clase reduce no-show-urile si face mai usor de gestionat locurile libere",
    cta: "Daca vrei sa vedem cum poate functiona pentru sala ta, iti trimit un exemplu rapid."
  },
  tatuaje: {
    label: "salon de tatuaje",
    problem: "consultatiile si rezervarile de sesiuni lungi ajung fragmentat pe Instagram si Messenger",
    benefit: "o pagina simpla de programari cu deposit online reduce no-show-urile la sesiunile lungi",
    cta: "Daca e de interes, iti trimit un exemplu aplicat pentru studiouri de tatuaje."
  },
  optician: {
    label: "cabinet oftalmologic / optica",
    problem: "consultatiile si probele de ochelari necesita timp si se gestioneaza greu fara un sistem",
    benefit: "programarile online cu reminder reduc asteptarea si optimizeaza fluxul din cabinet",
    cta: "Daca vrei, iti arat intr-un email scurt cum poate arata fluxul pentru cabinetul tau."
  }
};

function buildObservation(input: PersonalizationInput) {
  if (input.nicheSlug === "beauty-independent") {
    return `Salut ${input.businessName}, am vazut activitatea ta si mi-a venit ideea sa-ti scriu — pare ca majoritate clientelor iti scriu pe multiple canale (WhatsApp, Instagram, SMS, apeluri).`;
  }

  if (!input.website) {
    return `Am vazut ${input.businessName} in ${input.city} si pare ca prezenta online se bazeaza mai ales pe Google, telefon sau social media.`;
  }

  if (!input.observableSignals.bookingLinkDetected) {
    return `Am vazut site-ul ${input.businessName} si nu pare sa existe un pas foarte clar de programare online.`;
  }

  return `Am vazut ${input.businessName} din ${input.city} si faptul ca aveti deja prezenta online ajuta mult.`;
}

function buildFollowUp(input: PersonalizationInput, optOutText: string) {
  const subject = `Revin scurt pentru ${input.businessName}`;
  const text = [
    `Salut, revin foarte scurt legat de ${input.businessName}.`,
    "Daca programarile online sau confirmarile automate sunt o prioritate acum, pot trimite un exemplu foarte scurt si aplicat.",
    `Detalii rapide: ${OCUPALOC_SITE_URL}`,
    "Daca nu e momentul potrivit, spune-mi si opresc aici.",
    "",
    optOutText
  ].join("\n");

  const html = `<p>Salut, revin foarte scurt legat de <strong>${escapeHtml(input.businessName)}</strong>.</p>
<p>Daca programarile online sau confirmarile automate sunt o prioritate acum, pot trimite un exemplu foarte scurt si aplicat.</p>
<p>Detalii rapide: <a href="${OCUPALOC_SITE_URL}">ocupaloc.ro</a></p>
<p>Daca nu e momentul potrivit, spune-mi si opresc aici.</p>
<p style="font-size:12px;color:#64748b;">${escapeHtml(optOutText)}</p>`;

  return { subject, text, html };
}

function buildFollowUp2(input: PersonalizationInput, optOutText: string) {
  const subject = `Un singur lucru rapid pentru ${input.businessName}`;
  const text = [
    `Salut,`,
    "",
    `Am trimis doua mesaje anterioare despre programari online pentru ${input.businessName} si inteleg daca nu e prioritatea ta acum.`,
    "Voiam sa las totusi un singur lucru concret: in general, afacerile similare care trec la programari online economisesc intre 30 si 60 de minute pe zi din confirmari si reprogramari manuale.",
    `Poti vedea platforma aici: ${OCUPALOC_SITE_URL}`,
    "Daca vrei sa vedem daca si la voi e cazul, un apel de 10 minute e tot ce e nevoie.",
    "Daca nu, nicio problema.",
    "",
    optOutText
  ].join("\n");

  const html = `<p>Salut,</p>
<p>Am trimis doua mesaje anterioare despre programari online pentru <strong>${escapeHtml(input.businessName)}</strong> si inteleg daca nu e prioritatea ta acum.</p>
<p>Voiam sa las totusi un singur lucru concret: in general, afacerile similare care trec la programari online economisesc intre 30 si 60 de minute pe zi din confirmari si reprogramari manuale.</p>
<p>Poti vedea platforma aici: <a href="${OCUPALOC_SITE_URL}">ocupaloc.ro</a></p>
<p>Daca vrei sa vedem daca si la voi e cazul, un apel de 10 minute e tot ce e nevoie. Daca nu, nicio problema.</p>
<p style="font-size:12px;color:#64748b;">${escapeHtml(optOutText)}</p>`;

  return { subject, text, html };
}

function buildBreakUp(input: PersonalizationInput, optOutText: string) {
  const subject = `Inchid dosarul pentru ${input.businessName}`;
  const text = [
    `Salut,`,
    "",
    `Asta e ultimul meu mesaj legat de ${input.businessName}.`,
    "Inteleg ca poate nu e momentul potrivit sau pur si simplu nu e de interes si e complet in regula.",
    "Inchid dosarul si nu mai trimit nimic. Daca vreodata va fi relevant, stii unde sa ne gasesti: ocupaloc.ro",
    "",
    "Mult succes in continuare.",
    "",
    optOutText
  ].join("\n");

  const html = `<p>Salut,</p>
<p>Asta e ultimul meu mesaj legat de <strong>${escapeHtml(input.businessName)}</strong>.</p>
<p>Inteleg ca poate nu e momentul potrivit sau pur si simplu nu e de interes — complet in regula.</p>
<p>Inchid dosarul si nu mai trimit nimic. Daca vreodata va fi relevant, stii unde sa ne gasesti: <a href="https://ocupaloc.ro">ocupaloc.ro</a></p>
<p>Mult succes in continuare.</p>
<p style="font-size:12px;color:#64748b;">${escapeHtml(optOutText)}</p>`;

  return { subject, text, html };
}

function buildReactivation(input: PersonalizationInput, optOutText: string) {
  const subject = `Ceva nou pentru ${input.businessName}`;
  const text = [
    `Salut,`,
    "",
    `Am mai vorbit acum cateva luni legat de ${input.businessName}. Nu revin cu acelasi pitch.`,
    "Am vrut doar sa impartasesc ca am adaugat cateva lucruri pe care le-am construit pentru afaceri similare din Romania: confirmari automate, dashboard de programari si reminder-e personalizate.",
    `Platforma: ${OCUPALOC_SITE_URL}`,
    "Daca e un moment mai bun acum, iti trimit un exemplu in cateva minute. Daca nu, e in regula.",
    "",
    optOutText
  ].join("\n");

  const html = `<p>Salut,</p>
<p>Am mai vorbit acum cateva luni legat de <strong>${escapeHtml(input.businessName)}</strong>. Nu revin cu acelasi pitch.</p>
<p>Am vrut doar sa impartasesc ca am adaugat cateva lucruri noi: confirmari automate, dashboard de programari si reminder-e personalizate.</p>
<p>Platforma: <a href="${OCUPALOC_SITE_URL}">ocupaloc.ro</a></p>
<p>Daca e un moment mai bun acum, iti trimit un exemplu in cateva minute. Daca nu, e in regula.</p>
<p style="font-size:12px;color:#64748b;">${escapeHtml(optOutText)}</p>`;

  return { subject, text, html };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

export function generatePersonalizedOutreach(input: PersonalizationInput & { optOutUrl: string; senderName: string }): PersonalizationOutput {
  const parsed = personalizationInputSchema.parse(input);
  const nicheCopy = NICHE_COPY[parsed.nicheSlug] ?? NICHE_COPY.saloane;

  const subject = parsed.nicheSlug === "beauty-independent"
    ? "Îți pierzi cliente din cauza programărilor pe WhatsApp?"
    : `${parsed.businessName}: programari mai simple`;
    
  const optOutText = `Stop: ${input.optOutUrl}`;
  
  // For beauty-independent, use ultra-short format
  let text = "";
  if (parsed.nicheSlug === "beauty-independent") {
    text = [
      "Bună! 👋",
      "",
      "Dacă faci programările manual pe WhatsApp sau telefon, probabil ai trecut deja prin asta:",
      "• cliente care uită de programare",
      "• ore suprapuse",
      "• mesaje la 11 noaptea",
      "• timp pierdut zilnic doar ca să răspunzi",
      "",
      "Cu ocupaloc.ro, clientele își fac singure programarea online, exact pe orele libere.",
      "Tu primești: ✔ programări automate 24/7",
      "✔ confirmări și remindere automate",
      "✔ mai puține absențe",
      "✔ mai mult timp pentru tine și cliente",
      "",
      "Îți creezi pagina în doar câteva minute și ai 14 zile test gratuit.",
      "",
      `Vezi aici: ${OCUPALOC_SITE_URL}`,
      "Poate fi exact schimbarea de care ai nevoie.",
      `Stop: ${input.optOutUrl}`,
      `- Echipa ocupaloc.ro`
    ].join("\n");
  } else {
    text = [
      `Salut,`,
      "",
      `${nicheCopy.problem}`,
      `${nicheCopy.benefit}`,
      "",
      `${nicheCopy.cta}`,
      `${OCUPALOC_SITE_URL}`,
      `Stop: ${input.optOutUrl}`
    ].join("\n");
  }

  const html = parsed.nicheSlug === "beauty-independent"
    ? `<!DOCTYPE html>
<html lang="ro">
  <body style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:600px;margin:0 auto;padding:20px;">
    <p><strong>Bună! 👋</strong></p>
    <p>Dacă faci programările manual pe WhatsApp sau telefon, probabil ai trecut deja prin asta:</p>
    <ul style="margin:0 0 12px 20px;padding:0;">
      <li>cliente care uită de programare</li>
      <li>ore suprapuse</li>
      <li>mesaje la 11 noaptea</li>
      <li>timp pierdut zilnic doar ca să răspunzi</li>
    </ul>
    <p>Cu ocupaloc.ro, clientele își fac singure programarea online, exact pe orele libere.</p>
    <p>Tu primești: ✔ programări automate 24/7<br>✔ confirmări și remindere automate<br>✔ mai puține absențe<br>✔ mai mult timp pentru tine și cliente</p>
    <p>Îți creezi pagina în doar câteva minute și ai 14 zile test gratuit.</p>
    <p style="margin-top:20px;text-align:center;">
      <a href="${OCUPALOC_SITE_URL}" style="display:inline-block;background:#3b82f6;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Vezi aici</a>
    </p>
    <p style="text-align:center;margin-top:10px;">Poate fi exact schimbarea de care ai nevoie.</p>
    <p style="font-size:12px;color:#64748b;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:12px;text-align:center;">
      <a href="${input.optOutUrl}" style="color:#64748b;text-decoration:underline;">Sterge-ma din lista</a><br>
      - Echipa ocupaloc.ro
    </p>
  </body>
</html>`
    : `<!DOCTYPE html>
<html lang="ro">
  <body style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:600px;margin:0 auto;padding:20px;">
    <p>Salut,</p>
    <p><strong>${escapeHtml(nicheCopy.problem)}</strong></p>
    <p>${escapeHtml(nicheCopy.benefit)}.</p>
    <p>${escapeHtml(nicheCopy.cta)}</p>
    <p style="margin-top:20px;text-align:center;">
      <a href="${OCUPALOC_SITE_URL}" style="display:inline-block;background:#3b82f6;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Vezi aici</a>
    </p>
    <p style="font-size:12px;color:#64748b;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:12px;">
      <a href="${input.optOutUrl}" style="color:#64748b;text-decoration:underline;">Sterge-ma din lista</a>
    </p>
  </body>
</html>`;

  const followUp = buildFollowUp(parsed, optOutText);
  const followUp2 = buildFollowUp2(parsed, optOutText);
  const breakUp = buildBreakUp(parsed, optOutText);
  const reactivation = buildReactivation(parsed, optOutText);

  return {
    subject,
    text,
    html,
    followUpSubject: followUp.subject,
    followUpText: followUp.text,
    followUpHtml: followUp.html,
    followUp2Subject: followUp2.subject,
    followUp2Text: followUp2.text,
    followUp2Html: followUp2.html,
    breakUpSubject: breakUp.subject,
    breakUpText: breakUp.text,
    breakUpHtml: breakUp.html,
    reactivationSubject: reactivation.subject,
    reactivationText: reactivation.text,
    reactivationHtml: reactivation.html
  };
}