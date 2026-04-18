import Link from "next/link";

export default function BillingCanceledPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Plata nu a fost finalizată</h1>
      <p className="mt-4 text-zinc-700">
        Poți relua oricând activarea abonamentului: 14 zile gratuite, apoi 59,99 RON / lună.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/preturi"
          className="inline-flex items-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Reia checkout
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
        >
          Înapoi la dashboard
        </Link>
      </div>
    </main>
  );
}
