"use client";

import type { ReactNode } from "react";

export type OnboardingChecklistStep = {
  title: string;
  description: string;
  done: boolean;
  href?: string;
  linkLabel?: string;
  action?: ReactNode;
};

type Props = {
  title: string;
  subtitle: string;
  steps: OnboardingChecklistStep[];
};

export function OnboardingChecklist({ title, subtitle, steps }: Props) {
  const total = steps.length;
  const doneCount = steps.filter((s) => s.done).length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  const allDone = total > 0 && doneCount === total;

  return (
    <section className="rounded-2xl border border-oc-amber/30 bg-oc-amber-soft/80 px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-wide oc-accent">{title}</h2>
          <p className="mt-1 text-xs oc-secondary-text">{subtitle}</p>
        </div>
        {allDone ? (
          <span className="shrink-0 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            Setup complet
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs oc-secondary-text">
          <span>Progres</span>
          <span className="font-medium oc-text">{pct}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-oc-amber-soft">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ol className="mt-5 space-y-4">
        {steps.map((step, idx) => (
          <li key={step.title} className="flex gap-3 text-sm">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-center text-xs font-bold ${
                step.done ? "bg-emerald-500 text-white" : "border border-oc-amber/40 text-oc-warning"
              }`}
            >
              {step.done ? "✓" : String(idx + 1)}
            </span>
            <div className="min-w-0">
              <p className="font-medium oc-text">{step.title}</p>
              <p className="text-xs oc-secondary-text">{step.description}</p>
              {step.href ? (
                <a
                  href={step.href}
                  className="mt-1 inline-block text-xs font-medium oc-accent underline underline-offset-2"
                >
                  {step.linkLabel ?? "Deschide →"}
                </a>
              ) : null}
              {step.action ? <div className="mt-2">{step.action}</div> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
