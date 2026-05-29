import Link from "next/link";
import Script from "next/script";

export type VerticalBookingPageProps = {
  slug: string;
  breadcrumbLabel: string;
  h1: string;
  intro: string;
  ctaLocationPrefix: string;
  sectionTitle: string;
  paragraphs: string[];
  benefits: Array<{ title: string; text: string }>;
  faqItems: Array<{ question: string; answer: string }>;
  relatedLinks: Array<{ href: string; label: string }>;
};

/**
 * Layout comun pentru paginile SEO verticale (programări online pe nișă).
 * Conținutul (text, FAQ, beneficii) este unic per pagină și vine prin props,
 * astfel încât fiecare pagină rămâne distinctă pentru Google.
 */
export function VerticalBookingPage({
  slug,
  breadcrumbLabel,
  h1,
  intro,
  ctaLocationPrefix,
  sectionTitle,
  paragraphs,
  benefits,
  faqItems,
  relatedLinks
}: VerticalBookingPageProps) {
  const url = `https://ocupaloc.ro/${slug}`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasă", item: "https://ocupaloc.ro" },
      { "@type": "ListItem", position: 2, name: breadcrumbLabel, item: url }
    ]
  };

  return (
    <main className="min-h-screen oc-bg px-6 py-14 oc-text">
      <Script id={`faq-schema-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id={`breadcrumb-schema-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="mx-auto max-w-5xl space-y-10">
        <nav aria-label="Breadcrumb" className="text-sm oc-secondary-text">
          <Link href="/" className="hover:underline">Acasă</Link>
          <span className="px-1.5">/</span>
          <span className="oc-text">{breadcrumbLabel}</span>
        </nav>

        <section className="rounded-2xl border oc-border bg-white p-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{h1}</h1>
          <p className="mt-4 text-lg leading-relaxed oc-text">{intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup?start=1" data-cta-location={`${ctaLocationPrefix}_hero_primary`} className="rounded-lg oc-primary px-5 py-3 font-semibold text-white">
              Încearcă gratuit
            </Link>
            <Link href="/demo-interactiv" data-cta-location={`${ctaLocationPrefix}_hero_secondary`} className="rounded-lg border oc-border px-5 py-3 font-semibold oc-text hover:oc-badge-bg">
              Vezi demo
            </Link>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border oc-border bg-white p-8">
          <h2 className="text-3xl font-bold">{sectionTitle}</h2>
          {paragraphs.map((p, i) => (
            <p key={i} className="leading-relaxed oc-text">{p}</p>
          ))}
        </section>

        <section className="space-y-5">
          <h2 className="text-3xl font-bold">Ce primești cu OcupaLoc</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-xl border oc-border bg-white p-5">
                <h3 className="font-semibold oc-text">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed oc-secondary-text">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-bold">Întrebări frecvente</h2>
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-xl border oc-border bg-white p-5">
              <h3 className="text-lg font-semibold">{item.question}</h3>
              <p className="mt-2 leading-relaxed oc-secondary-text">{item.answer}</p>
            </article>
          ))}
        </section>

        <section className="rounded-xl border oc-border bg-white p-5">
          <h2 className="text-2xl font-bold">Vezi și:</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {relatedLinks.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg border oc-border px-4 py-2 text-sm hover:oc-badge-bg">
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
