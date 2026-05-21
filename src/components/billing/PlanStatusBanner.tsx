export type PlanStatus =
  | { kind: "trial"; daysLeft: number }
  | { kind: "active"; periodEnd: string }
  | { kind: "past_due" }
  | { kind: "canceled" }
  | { kind: "trialing_stripe"; daysLeft: number }
  | { kind: "none" };

type Props = {
  status: PlanStatus;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
}

export function PlanStatusBanner({ status }: Props) {
  if (status.kind === "active") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm">
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
        <span className="text-emerald-900">
          Abonament activ — reînnoire automată pe <strong>{fmt(status.periodEnd)}</strong>.
        </span>
        <form action="/api/billing/portal" method="post" className="ml-auto shrink-0">
          <button type="submit" className="text-xs font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-800">
            Gestionează
          </button>
        </form>
      </div>
    );
  }

  if (status.kind === "trialing_stripe") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm">
        <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />
        <span className="text-sky-900">
          Trial activ — mai ai <strong>{status.daysLeft} zile</strong> gratuite.
        </span>
        <form method="get" action="/api/billing/create-checkout" className="ml-auto shrink-0">
          <button type="submit" className="text-xs font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-800">
            Actualizează cardul
          </button>
        </form>
      </div>
    );
  }

  if (status.kind === "trial") {
    if (status.daysLeft <= 3) {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-orange-300 bg-orange-50 px-4 py-3 text-sm">
          <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />
          <span className="text-orange-900">
            Trial expiră în{" "}
            <strong>
              {status.daysLeft === 0 ? "mai puțin de 24h" : `${status.daysLeft} ${status.daysLeft === 1 ? "zi" : "zile"}`}
            </strong>{" "}
            — după aceea nu mai primești programări noi.
          </span>
          <form method="get" action="/api/billing/create-checkout" className="ml-auto shrink-0">
            <button type="submit" className="text-xs font-semibold text-orange-700 underline underline-offset-2 hover:text-orange-800">
              Activează acum
            </button>
          </form>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm">
        <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />
        <span className="text-sky-900">
          Perioadă de trial — mai ai <strong>{status.daysLeft} zile</strong> gratuite.
        </span>
        <form method="get" action="/api/billing/create-checkout" className="ml-auto shrink-0">
          <button type="submit" className="text-xs font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-800">
            Activează planul
          </button>
        </form>
      </div>
    );
  }

  if (status.kind === "past_due") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm">
        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
        <span className="text-red-900">
          Plată restantă — accesează portalul de facturare pentru a nu pierde programările.
        </span>
        <form action="/api/billing/portal" method="post" className="ml-auto shrink-0">
          <button type="submit" className="text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-800">
            Rezolvă acum
          </button>
        </form>
      </div>
    );
  }

  if (status.kind === "canceled") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border oc-border bg-white px-4 py-3 text-sm">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#94A3B8]" />
        <span className="oc-secondary-text">
          Abonamentul a fost anulat. Reabonează-te pentru a reactiva programările. O nouă perioadă de trial nu este acordată automat.
        </span>
        <form method="get" action="/api/billing/create-checkout" className="ml-auto shrink-0">
          <button type="submit" className="text-xs font-semibold text-oc-teal underline underline-offset-2 hover:text-oc-teal-dark">
            Reabonează-te
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm">
      <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
      <span className="text-red-900">Nu ai un abonament activ. Programările noi sunt blocate.</span>
      <form method="get" action="/api/billing/create-checkout" className="ml-auto shrink-0">
        <button type="submit" className="text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-800">
          Activează acum
        </button>
      </form>
    </div>
  );
}
