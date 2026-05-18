type LegalSection = {
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  lastUpdated: string;
  sections: readonly LegalSection[];
};

export function LegalPage({ eyebrow, title, intro, lastUpdated, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen oc-bg px-6 py-14 oc-text">
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-4 rounded-3xl border oc-border bg-white p-8 shadow-[0_20px_45px_-30px_rgba(15,118,110,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] oc-accent">{eyebrow}</p>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
            <p className="max-w-3xl text-base leading-7 oc-secondary-text md:text-lg">{intro}</p>
          </div>
          <p className="text-sm oc-secondary-text">Ultima actualizare: {lastUpdated}</p>
        </header>

        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="rounded-3xl border oc-border bg-white p-7">
              <h2 className="text-2xl font-semibold oc-text">{section.title}</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 oc-secondary-text md:text-base">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets?.length ? (
                  <ul className="space-y-2 pl-5 oc-secondary-text">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="list-disc">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}