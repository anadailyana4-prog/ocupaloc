export type ZiProgram = "luni" | "marti" | "miercuri" | "joi" | "vineri" | "sambata" | "duminica";

export type ProgramSaptamanal = Record<ZiProgram, [string, string] | []>;
export type ProgramPauzaConfig = {
  start: string;
  durationMinutes: number;
};

export type ProgramSlotStrategy = "service_duration" | "fixed_step";
export type ProgramSlotConfig = {
  strategy: ProgramSlotStrategy;
  fixedStepMinutes?: number;
};

const PAUZA_PROGRAM_KEY = "__pauza";
const SLOT_PROGRAM_KEY = "__sloturi";

const DEFAULT_SLOT_CONFIG: ProgramSlotConfig = {
  strategy: "service_duration"
};

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

function parseHHMM(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d{2}:\d{2}$/.test(trimmed)) return null;
  return trimmed;
}

function normalizeFixedStepMinutes(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 5 || n > 180) return null;
  return n;
}

function normalizeSlotConfig(slot: ProgramSlotConfig | null | undefined): ProgramSlotConfig | null {
  if (!slot) return null;
  if (slot.strategy === "service_duration") {
    return { strategy: "service_duration" };
  }
  if (slot.strategy === "fixed_step") {
    const fixedStepMinutes = normalizeFixedStepMinutes(slot.fixedStepMinutes);
    if (!fixedStepMinutes) return null;
    return {
      strategy: "fixed_step",
      fixedStepMinutes
    };
  }
  return null;
}

export function extractProgramPauza(raw: unknown): ProgramPauzaConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const value = obj[PAUZA_PROGRAM_KEY];
  if (!value || typeof value !== "object") return null;

  const pauza = value as Record<string, unknown>;
  const start = parseHHMM(pauza.start);
  const duration = Number(pauza.duration_minutes);
  if (!start || !Number.isInteger(duration) || duration <= 0 || duration > 240) {
    return null;
  }

  return {
    start,
    durationMinutes: duration
  };
}

export function extractProgramSlotConfig(raw: unknown): ProgramSlotConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const value = obj[SLOT_PROGRAM_KEY];
  if (!value || typeof value !== "object") return null;

  const slotRaw = value as Record<string, unknown>;
  const strategy = slotRaw.strategy;
  if (strategy === "service_duration") {
    return { strategy: "service_duration" };
  }
  if (strategy === "fixed_step") {
    const fixedStepMinutes = normalizeFixedStepMinutes(slotRaw.fixed_step_minutes);
    if (!fixedStepMinutes) return null;
    return {
      strategy: "fixed_step",
      fixedStepMinutes
    };
  }

  return null;
}

export function getProgramSlotConfig(raw: unknown): ProgramSlotConfig {
  return extractProgramSlotConfig(raw) ?? { ...DEFAULT_SLOT_CONFIG };
}

export function serializeProgram(
  program: ProgramSaptamanal,
  options?: {
    pauza?: ProgramPauzaConfig | null;
    slotConfig?: ProgramSlotConfig | null;
  }
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...program };

  if (options?.pauza) {
    out[PAUZA_PROGRAM_KEY] = {
      start: options.pauza.start,
      duration_minutes: options.pauza.durationMinutes
    };
  }

  const normalizedSlotConfig = normalizeSlotConfig(options?.slotConfig ?? null);
  if (normalizedSlotConfig) {
    if (normalizedSlotConfig.strategy === "service_duration") {
      out[SLOT_PROGRAM_KEY] = { strategy: "service_duration" };
    } else {
      out[SLOT_PROGRAM_KEY] = {
        strategy: "fixed_step",
        fixed_step_minutes: normalizedSlotConfig.fixedStepMinutes
      };
    }
  }

  return out;
}

export function withProgramPauza(raw: unknown, pauza: ProgramPauzaConfig | null): Record<string, unknown> {
  const program = parseProgramJson(raw);
  const slotConfig = extractProgramSlotConfig(raw);
  return serializeProgram(program, {
    pauza,
    slotConfig
  });
}

export function withProgramSlotConfig(raw: unknown, slotConfig: ProgramSlotConfig | null): Record<string, unknown> {
  const program = parseProgramJson(raw);
  const pauza = extractProgramPauza(raw);
  return serializeProgram(program, {
    pauza,
    slotConfig
  });
}
