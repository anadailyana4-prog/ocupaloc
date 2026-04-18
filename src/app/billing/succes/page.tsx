import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Abonament activat</h1>
      <p className="mt-4 text-zinc-700">
        Contul tău este configurat cu 14 zile gratuite, apoi plata se face automat lunar la 59,99 RON.
      </p>
      <div className="mt-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Mergi în dashboard
        </Link>
      </div>
    </main>
  );
}
