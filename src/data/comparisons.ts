export const comparisons = {
  fresha: {
    name: "Fresha",
    comision: "2-3% per programare",
    pret: "Gratis + comision",
    pierdereLa100: (100 * 10) - 99.99,
    dezavantaje: ["Comision la fiecare client", "Suport în engleză", "Datele nu sunt în RO"]
  },
  treatwell: {
    name: "Treatwell",
    comision: "25-30%",
    pret: "Comision mare",
    pierdereLa100: (100 * 25) - 99.99,
    dezavantaje: ["Comision foarte mare", "Nu controlezi clienții"]
  },
  booksy: {
    name: "Booksy",
    comision: "0",
    pret: "299 RON/lună",
    pierdereLa100: 299 - 99.99,
    dezavantaje: ["Scump", "Interfață complexă"]
  },
  stailer: {
    name: "Stailer",
    comision: "0",
    pret: "~150 RON",
    pierdereLa100: 150 - 99.99,
    dezavantaje: ["Mai puține funcții", "Fără aplicație mobilă"]
  }
} as const;

export type ComparisonSlug = keyof typeof comparisons;

