export type PresetServiciu = {
  nume: string;
  durata_minute: number;
  pret: number;
  culoare: string;
};

export const PRESETURI: Record<string, PresetServiciu[]> = {
  frizerie: [
    { nume: "Tuns bărbați", durata_minute: 30, pret: 80, culoare: "#3B82F6" },
    { nume: "Tuns + barba", durata_minute: 45, pret: 100, culoare: "#8B5CF6" },
    { nume: "Vopsit păr", durata_minute: 90, pret: 200, culoare: "#EC4899" }
  ],
  manichiura: [
    { nume: "Semi permanentă", durata_minute: 90, pret: 120, culoare: "#F472B6" },
    { nume: "Gel pe unghie naturală", durata_minute: 120, pret: 150, culoare: "#A78BFA" },
    { nume: "Întreținere", durata_minute: 60, pret: 80, culoare: "#FB7185" }
  ],
  gene: [
    { nume: "Aplicare fir cu fir 1D", durata_minute: 120, pret: 200, culoare: "#C084FC" },
    { nume: "Aplicare 2D-3D", durata_minute: 150, pret: 250, culoare: "#818CF8" },
    { nume: "Întreținere 2-3 săpt", durata_minute: 90, pret: 150, culoare: "#60A5FA" }
  ],
  pensat: [
    { nume: "Pensat cu ață", durata_minute: 20, pret: 40, culoare: "#34D399" },
    { nume: "Pensat + vopsit", durata_minute: 30, pret: 60, culoare: "#2DD4BF" }
  ],
  tatuaje: [
    { nume: "Consult + design", durata_minute: 30, pret: 0, culoare: "#000000" },
    { nume: "Tatuaj mic sub 5cm", durata_minute: 60, pret: 300, culoare: "#4B5563" },
    { nume: "Tatuaj mediu", durata_minute: 180, pret: 800, culoare: "#1F2937" }
  ],
  mixt: []
};

export const CATEGORII_ONBOARDING = [
  { id: "frizerie", label: "Frizerie / Barber", icon: "Scissors" },
  { id: "manichiura", label: "Manichiură / Pedichiură", icon: "Sparkles" },
  { id: "gene", label: "Gene false", icon: "Eye" },
  { id: "pensat", label: "Pensat / Estetică", icon: "Flower2" },
  { id: "tatuaje", label: "Tatuaje", icon: "PenTool" },
  { id: "mixt", label: "Mixt / Altele", icon: "LayoutGrid" }
] as const;
