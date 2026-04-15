export type ZiProgram = "luni" | "marti" | "miercuri" | "joi" | "vineri" | "sambata" | "duminica";

export type ProgramSaptamanal = Record<ZiProgram, [string, string] | []>;

export const ZILE_ORDINE: ZiProgram[] = [
  "luni",
  "marti",
  "miercuri",
  "joi",
  "vineri",
  "sambata",
  "duminica"
];

export const DEFAULT_PROGRAM: ProgramSaptamanal = {
  luni: ["09:00", "18:00"],
  marti: ["09:00", "18:00"],
  miercuri: ["09:00", "18:00"],
  joi: ["09:00", "18:00"],
  vineri: ["09:00", "18:00"],
  sambata: [],
  duminica: []
};

export function ziKeyFromDate(d: Date): ZiProgram {
  const map: ZiProgram[] = ["duminica", "luni", "marti", "miercuri", "joi", "vineri", "sambata"];
  return map[d.getDay()]!;
}

export function parseProgramJson(raw: unknown): ProgramSaptamanal {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PROGRAM };
  const o = raw as Record<string, unknown>;
  const out: ProgramSaptamanal = { ...DEFAULT_PROGRAM };
  for (const z of ZILE_ORDINE) {
    const v = o[z];
    if (Array.isArray(v) && v.length === 2 && typeof v[0] === "string" && typeof v[1] === "string") {
      out[z] = [v[0], v[1]];
    } else {
      out[z] = [];
    }
  }
  return out;
}
