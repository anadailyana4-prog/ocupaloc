import { personalizationInputSchema } from "@/lib/outreach/ops-schemas";
import type { PersonalizationInput } from "@/lib/outreach/ops-schemas";

interface PersonalizationOutput {
  subject: string;
  text: string;
  html: string;
  followUpSubject: string;
  followUpText: string;
  followUpHtml: string;
}

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
  "clinici-estetice": {
    label: "clinica estetica",
    problem: "solicitarile initiale se strang in prea multe canale, iar trierea devine greoaie",
    benefit: "un formular si un flux de programare bine asezate pot filtra mai bine cererile utile",
    cta: "Daca e relevant, iti trimit un exemplu sobru pentru o clinica din Romania."
  }
};

function buildObservation(input: PersonalizationInput) {
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
    "Daca nu e momentul potrivit, spune-mi si opresc aici.",
    "",
    optOutText
  ].join("\n");

  const html = `<p>Salut, revin foarte scurt legat de <strong>${escapeHtml(input.businessName)}</strong>.</p>
<p>Daca programarile online sau confirmarile automate sunt o prioritate acum, pot trimite un exemplu foarte scurt si aplicat.</p>
<p>Daca nu e momentul potrivit, spune-mi si opresc aici.</p>
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
  const observation = buildObservation(parsed);
  const signalNote = parsed.observableSignals.instagramDetected
    ? "Se vede ca inbound-ul poate veni si din Instagram, iar acolo raspunsurile se fragmenteaza usor."
    : parsed.observableSignals.hasServiceMenu
      ? "Faptul ca aveti deja serviciile vizibile ajuta, dar rezervarea poate fi facuta si mai simpla."
      : "Ideea nu este sa schimbati tot, ci doar sa faceti programarea mai simpla pentru clientii potriviti.";

  const subject = `${parsed.businessName}: o propunere scurta pentru programari mai simple`;
  const optOutText = `Daca nu vrei sa mai primesti mesaje de acest tip, raspunde cu "stop" sau foloseste linkul de opozitie: ${input.optOutUrl}`;
  const text = [
    `Salut,`,
    "",
    observation,
    `In zona de ${nicheCopy.label}, ${nicheCopy.problem}.`,
    `${nicheCopy.benefit}.`,
    signalNote,
    nicheCopy.cta,
    "",
    `Cu bine,`,
    input.senderName,
    "",
    optOutText
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="ro">
  <body style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:640px;margin:0 auto;padding:24px;">
    <p>Salut,</p>
    <p>${escapeHtml(observation)}</p>
    <p>In zona de <strong>${escapeHtml(nicheCopy.label)}</strong>, ${escapeHtml(nicheCopy.problem)}.</p>
    <p>${escapeHtml(nicheCopy.benefit)}.</p>
    <p>${escapeHtml(signalNote)}</p>
    <p>${escapeHtml(nicheCopy.cta)}</p>
    <p>Cu bine,<br>${escapeHtml(input.senderName)}</p>
    <p style="font-size:12px;color:#64748b;">${escapeHtml(optOutText)}</p>
  </body>
</html>`;

  const followUp = buildFollowUp(parsed, optOutText);

  return {
    subject,
    text,
    html,
    followUpSubject: followUp.subject,
    followUpText: followUp.text,
    followUpHtml: followUp.html
  };
}