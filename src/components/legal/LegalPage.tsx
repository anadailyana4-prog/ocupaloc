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
    <main className="min-h-screen bg-zinc-950 px-6 py-14 text-zinc-100">
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl shadow-black/20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">{eyebrow}</p>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
            <p className="max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">{intro}</p>
          </div>
          <p className="text-sm text-zinc-500">Ultima actualizare: {lastUpdated}</p>
        </header>

        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-7">
              <h2 className="text-2xl font-semibold text-zinc-50">{section.title}</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-300 md:text-base">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets?.length ? (
                  <ul className="space-y-2 pl-5 text-zinc-300">
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