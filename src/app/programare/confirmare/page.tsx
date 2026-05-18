import Link from "next/link";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ state?: string; slug?: string }>;
};

function textForState(state: string) {
  switch (state) {
    case "confirmed":
      return {
        title: "Programare confirmată",
        desc: "Mulțumim! Prezența ta a fost confirmată.",
        ok: true
      };
    case "cancelled":
      return {
        title: "Programare anulată",
        desc: "Am înregistrat anularea. Dacă vrei, poți face o nouă rezervare.",
        ok: false
      };
    case "not_found":
      return {
        title: "Programarea nu a fost găsită",
        desc: "Este posibil ca linkul să nu mai fie valid.",
        ok: false
      };
    case "invalid":
      return {
        title: "Link invalid sau expirat",
        desc: "Cere un nou link de confirmare.",
        ok: false
      };
    default:
      return {
        title: "Nu am putut procesa cererea",
        desc: "Încearcă din nou sau contactează furnizorul.",
        ok: false
      };
  }
}

export default async function BookingConfirmationPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const state = sp.state ?? "error";
  const slug = sp.slug;
  const copy = textForState(state);

  return (
    <main className="min-h-screen oc-bg px-4 py-16 oc-text">
      <div className="mx-auto max-w-xl rounded-2xl border oc-border bg-white p-8 text-center">
        <p className={`mb-4 text-4xl ${copy.ok ? "oc-accent" : "oc-primary-text"}`}>{copy.ok ? "✓" : "!"}</p>
        <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
        <p className="mt-3 oc-secondary-text">{copy.desc}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {slug ? (
            <Link href={`/${slug}`} className="rounded-full oc-primary px-5 py-2.5 text-sm font-semibold text-white">
              Înapoi la pagina de rezervare
            </Link>
          ) : null}
          <Link href="/" className="rounded-full border oc-border bg-white px-5 py-2.5 text-sm font-semibold oc-accent hover:oc-badge-bg">
            Acasă
          </Link>
        </div>
      </div>
    </main>
  );
}
