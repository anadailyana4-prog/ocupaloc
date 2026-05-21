"use client";

import { useState } from "react";

export function CancelSubscriptionButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [cancelMode, setCancelMode] = useState<"period_end" | "immediate">("period_end");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!reason) {
      event.preventDefault();
      window.alert("Te rog alege un motiv pentru anulare.");
      return;
    }

    const ok = window.confirm(
      cancelMode === "immediate"
        ? "Sigur vrei să anulezi imediat abonamentul? Accesul se oprește acum, iar reactivarea nu include automat o nouă perioadă de trial."
        : "Sigur vrei să oprești reînnoirea abonamentului? Accesul rămâne activ până la finalul perioadei curente, iar reactivarea nu include automat o nouă perioadă de trial."
    );
    if (!ok) {
      event.preventDefault();
      return;
    }
    setIsSubmitting(true);
  }

  return (
    <form method="post" action="/api/billing/cancel" onSubmit={handleSubmit}>
      <label htmlFor="cancel_reason" className="mb-2 block text-sm oc-secondary-text">
        Motivul principal al anulării
      </label>
      <select
        id="cancel_reason"
        name="cancel_reason"
        required
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        className="mb-3 w-full rounded-xl border dash-input px-3 py-2 text-sm oc-text"
      >
        <option value="">Alege motivul</option>
        <option value="prea_scump">Prețul este prea mare</option>
        <option value="lipsa_functii">Îmi lipsesc funcții importante</option>
        <option value="temporar_inchis">Business-ul este închis temporar</option>
        <option value="suport">Am avut probleme de suport sau stabilitate</option>
        <option value="altul">Alt motiv</option>
      </select>

      <label htmlFor="cancel_note" className="mb-2 block text-sm oc-secondary-text">
        Detalii opționale
      </label>

      <label htmlFor="cancel_mode" className="mb-2 block text-sm oc-secondary-text">
        Tipul anulării
      </label>
      <select
        id="cancel_mode"
        name="cancel_mode"
        value={cancelMode}
        onChange={(event) => setCancelMode(event.target.value === "immediate" ? "immediate" : "period_end")}
        className="mb-3 w-full rounded-xl border dash-input px-3 py-2 text-sm oc-text"
      >
        <option value="period_end">La finalul perioadei curente (recomandat)</option>
        <option value="immediate">Imediat (oprește accesul acum)</option>
      </select>

      <textarea
        id="cancel_note"
        name="cancel_note"
        rows={3}
        maxLength={500}
        className="mb-4 w-full rounded-xl border dash-input px-3 py-2 text-sm oc-text"
        placeholder="Spune-ne pe scurt ce am putea îmbunătăți"
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Se anulează..." : "Anulează abonamentul"}
      </button>
    </form>
  );
}
