"use client";

import { useState } from "react";

export function CancelSubscriptionButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const ok = window.confirm(
      "Sigur vrei să anulezi abonamentul acum? Nu se vor mai retrage bani, iar accesul premium va fi oprit imediat."
    );
    if (!ok) {
      event.preventDefault();
      return;
    }
    setIsSubmitting(true);
  }

  return (
    <form method="post" action="/api/billing/cancel" onSubmit={handleSubmit}>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center rounded-full border border-red-500/40 bg-red-950/40 px-4 py-2 text-sm font-medium text-red-200 transition hover:border-red-400/60 hover:bg-red-900/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Se anulează..." : "Anulează abonamentul"}
      </button>
    </form>
  );
}
