import Link from "next/link";

export default function BillingCanceledPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl oc-bg px-6 py-16 oc-text">
      <h1 className="text-3xl font-semibold tracking-tight">Plata nu a fost finalizată</h1>
      <p className="mt-4 oc-secondary-text">
        Poți relua activarea planului. Perioada gratuită se aplică o singură dată pentru business-urile eligibile conform politicii de trial.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/preturi"
          className="inline-flex items-center rounded-full oc-primary px-5 py-2.5 text-sm font-medium text-white transition"
        >
          Reia checkout
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full border oc-border bg-white px-5 py-2.5 text-sm font-medium oc-accent transition hover:oc-badge-bg"
        >
          Înapoi la meniu
        </Link>
      </div>
    </main>
  );
}
