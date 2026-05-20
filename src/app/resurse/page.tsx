import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Resurse Gratuite pentru Saloane | OcupaLoc",
  description:
    "Calculator ROI, template-uri, ghiduri și tool-uri gratuite pentru digitalizarea și creșterea salonului tău.",
  alternates: { canonical: "https://ocupaloc.ro/resurse" },
};

const resources = [
  {
    slug: "calculator-roi",
    title: "Calculator ROI Programări Online",
    description: "Calculează economiile anuale prin trecerea de la agendă fizică la programări digitale.",
    icon: "📊",
    type: "Tool",
  },
  {
    slug: "template-postari-social",
    title: "10 Template-uri Postări Social Media",
    description: "Copy-paste ready pentru Instagram și Facebook. Crește engagement fără să fii creativ.",
    icon: "📱",
    type: "Template",
  },
  {
    slug: "ghid-whatsapp-business",
    title: "Ghid WhatsApp Business pentru Saloane",
    description: "Cum să configurezi și folosești WhatsApp Business pentru confirmări și reminder-e.",
    icon: "💬",
    type: "Ghid",
  },
  {
    slug: "lista-verificare-onboarding",
    title: "Listă de Verificare Onboarding Digital",
    description: "25 de pași pentru a digitaliza complet salonul în 30 de zile.",
    icon: "✅",
    type: "Checklist",
  },
  {
    slug: "raport-industrie-beauty-2025",
    title: "Raport Industrie Beauty România 2025",
    description: "Statistici, tendințe și oportunități în piața de înfrumusețare.",
    icon: "📈",
    type: "Studiu",
  },
  {
    slug: "template-email-clienti",
    title: "15 Template-uri Email pentru Clienți",
    description: "Confirmări, reminder-e, reactivare, oferte speciale - copy ready.",
    icon: "📧",
    type: "Template",
  },
  {
    slug: "ghid-fotografie-salon",
    title: "Ghid Fotografie pentru Saloane",
    description: "Cum să faci poze profesionale cu telefonul pentru social media.",
    icon: "📸",
    type: "Ghid",
  },
  {
    slug: "calculator-preturi-servicii",
    title: "Calculator Prețuri Servicii",
    description: "Determină prețul corect pentru servicii bazat pe costuri și timp.",
    icon: "💰",
    type: "Tool",
  },
];

export default function ResursePage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasă", item: "https://ocupaloc.ro" },
      { "@type": "ListItem", position: 2, name: "Resurse", item: "https://ocupaloc.ro/resurse" },
    ],
  };

  return (
    <main className="min-h-screen oc-bg px-6 py-14 oc-text">
      <Script id="breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Resurse Gratuite pentru Digitalizarea Salonului
          </h1>
          <p className="text-xl oc-secondary-text max-w-3xl mx-auto">
            Tool-uri, template-uri, ghiduri și studii pentru a-ți crește salonul 
            fără să investești în consultanți scumpi.
          </p>
        </header>

        {/* Resources Grid */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {resources.map((resource) => (
            <article
              key={resource.slug}
              className="rounded-2xl border oc-border bg-white p-6 hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-4">{resource.icon}</div>
              <div className="text-xs font-semibold oc-accent uppercase tracking-wide mb-2">
                {resource.type}
              </div>
              <h2 className="text-lg font-bold mb-2 leading-tight">
                {resource.title}
              </h2>
              <p className="text-sm oc-secondary-text mb-4">
                {resource.description}
              </p>
              <Link
                href={`/resurse/${resource.slug}`}
                className="text-sm font-semibold oc-accent hover:underline"
              >
                Descarcă gratuit →
              </Link>
            </article>
          ))}
        </section>

        {/* CTA Section */}
        <section className="rounded-2xl border oc-border oc-primary p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">
            Vrei să digitalizezi complet salonul?
          </h2>
          <p className="mb-6 max-w-xl mx-auto oc-secondary-text">
            OcupaLoc îți oferă software de programări la 59.99 RON/lună, fără comision. 
            14 zile gratuite, setup în 15 minute.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/signup?start=1" className="rounded-lg oc-primary px-6 py-3 font-semibold text-white">
              Începe gratuit
            </Link>
            <Link href="/demo-interactiv" className="rounded-lg border oc-border bg-white px-6 py-3 font-semibold hover:oc-badge-bg">
              Vezi demo
            </Link>
          </div>
        </section>

        {/* Categories */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Categorii Resurse</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border oc-border bg-white p-5">
              <h3 className="font-semibold mb-2">🛠️ Tool-uri</h3>
              <p className="text-sm oc-secondary-text">
                Calculatoare ROI, prețuri și analiză. Date concrete pentru decizii informate.
              </p>
            </div>
            <div className="rounded-xl border oc-border bg-white p-5">
              <h3 className="font-semibold mb-2">📋 Template-uri</h3>
              <p className="text-sm oc-secondary-text">
                Copy-paste ready pentru social media, email-uri și comunicare cu clienții.
              </p>
            </div>
            <div className="rounded-xl border oc-border bg-white p-5">
              <h3 className="font-semibold mb-2">📚 Ghiduri</h3>
              <p className="text-sm oc-secondary-text">
                Tutoriale pas cu pas pentru WhatsApp Business, fotografie, SEO și marketing.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
