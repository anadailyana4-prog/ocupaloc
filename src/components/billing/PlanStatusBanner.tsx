import Link from "next/link";

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
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/30 px-4 py-3 text-sm">
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]" />
        <span className="text-emerald-200">
          Abonament activ — reînnoire automată pe <strong>{fmt(status.periodEnd)}</strong>.
        </span>
        <form action="/api/billing/portal" method="post" className="ml-auto shrink-0">
          <button type="submit" className="text-xs text-emerald-400 underline underline-offset-2 hover:text-emerald-300">
            Gestionează
          </button>
        </form>
      </div>
    );
  }

  if (status.kind === "trialing_stripe") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-950/30 px-4 py-3 text-sm">
        <span className="h-2 w-2 shrink-0 rounded-full bg-blue-400 shadow-[0_0_6px_2px_rgba(96,165,250,0.4)]" />
        <span className="text-blue-200">
          Trial activ — mai ai <strong>{status.daysLeft} zile</strong> gratuite.
        </span>
        <Link href="/preturi" className="ml-auto shrink-0 text-xs text-blue-400 underline underline-offset-2 hover:text-blue-300">
          Abonează-te
        </Link>
      </div>
    );
  }

  if (status.kind === "trial") {
    if (status.daysLeft <= 3) {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-orange-500/30 bg-orange-950/30 px-4 py-3 text-sm">
          <span className="h-2 w-2 shrink-0 rounded-full bg-orange-400 shadow-[0_0_6px_2px_rgba(251,146,60,0.4)]" />
          <span className="text-orange-200">
            Trial expiră în <strong>{status.daysLeft === 0 ? "mai puțin de 24h" : `${status.daysLeft} ${status.daysLeft === 1 ? "zi" : "zile"}`}</strong> — după aceea nu mai primești programări noi.
          </span>
          <Link href="/preturi" className="ml-auto shrink-0 text-xs font-semibold text-orange-400 underline underline-offset-2 hover:text-orange-300">
            Activează acum
          </Link>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-sky-500/20 bg-sky-950/20 px-4 py-3 text-sm">
        <span className="h-2 w-2 shrink-0 rounded-full bg-sky-400" />
        <span className="text-sky-200">
          Perioadă de trial — mai ai <strong>{status.daysLeft} zile</strong> gratuite.
        </span>
        <Link href="/preturi" className="ml-auto shrink-0 text-xs text-sky-400 underline underline-offset-2 hover:text-sky-300">
          Vezi planuri
        </Link>
      </div>
    );
  }

  if (status.kind === "past_due") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm">
        <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
        <span className="text-red-200">
          Plată restantă — accesează portalul de facturare pentru a nu pierde programările.
        </span>
        <form action="/api/billing/portal" method="post" className="ml-auto shrink-0">
          <button type="submit" className="text-xs font-semibold text-red-400 underline underline-offset-2 hover:text-red-300">
            Rezolvă acum
          </button>
        </form>
      </div>
    );
  }

  if (status.kind === "canceled") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-600/30 bg-zinc-900/40 px-4 py-3 text-sm">
        <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-500" />
        <span className="text-zinc-300">
          Abonamentul a fost anulat. Reabonează-te pentru a reactiva programările.
        </span>
        <Link href="/preturi" className="ml-auto shrink-0 text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-300">
          Reabonează-te
        </Link>
      </div>
    );
  }

  // kind === "none" — no sub, no trial (very unlikely in practice but defensive)
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm">
      <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
      <span className="text-red-200">
        Nu ai un abonament activ. Programările noi sunt blocate.
      </span>
      <Link href="/preturi" className="ml-auto shrink-0 text-xs font-semibold text-red-400 underline underline-offset-2 hover:text-red-300">
        Abonează-te
      </Link>
    </div>
  );
}
