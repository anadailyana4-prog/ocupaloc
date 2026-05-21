import type { Metadata } from "next";

import { CalculatorROIClient } from "./calculator-roi-client";

export const metadata: Metadata = {
  title: "Calculator Economii Salon | OcupaLoc",
  description:
    "Calculează cât economisești anual trecând de la agendă fizică sau comision la programări online cu OcupaLoc.",
  alternates: { canonical: "https://ocupaloc.ro/calculator-roi" }
};

export default function CalculatorROIPage() {
  return <CalculatorROIClient />;
}
