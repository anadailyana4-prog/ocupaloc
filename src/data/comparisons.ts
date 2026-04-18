export const comparisons = {
  fresha: {
    name: "Platformă A",
    comision: "2-3% per programare",
    pret: "Gratis + comision",
    pierdereLa100: (100 * 10) - 59.99,
    dezavantaje: ["Comision la fiecare client", "Suport în engleză", "Datele nu sunt în RO"]
  },
  treatwell: {
    name: "Platformă B",
    comision: "25-30%",
    pret: "Comision mare",
    pierdereLa100: (100 * 25) - 59.99,
    dezavantaje: ["Comision foarte mare", "Nu controlezi clienții"]
  },
  booksy: {
    name: "Platformă C",
    comision: "0",
    pret: "299 RON/lună",
    pierdereLa100: 299 - 59.99,
    dezavantaje: ["Scump", "Interfață complexă"]
  },
  stailer: {
    name: "Platformă D",
    comision: "0",
    pret: "~150 RON",
    pierdereLa100: 150 - 59.99,
    dezavantaje: ["Mai puține funcții", "Fără aplicație mobilă"]
  }
} as const;

export type ComparisonSlug = keyof typeof comparisons;

