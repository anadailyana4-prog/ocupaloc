import Link from "next/link";

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
        desc: "Cere salonului un nou link de confirmare.",
        ok: false
      };
    default:
      return {
        title: "Nu am putut procesa cererea",
        desc: "Încearcă din nou sau contactează salonul.",
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
    <main className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
      <div className="mx-auto max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <p className={`mb-4 text-4xl ${copy.ok ? "text-emerald-400" : "text-amber-400"}`}>{copy.ok ? "✓" : "!"}</p>
        <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
        <p className="mt-3 text-zinc-300">{copy.desc}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {slug ? (
            <Link href={`/${slug}`} className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
              Înapoi la pagina salonului
            </Link>
          ) : null}
          <Link href="/" className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-800">
            Acasă
          </Link>
        </div>
      </div>
    </main>
  );
}
