type MaybeError = { message?: string | null } | null | undefined;

export function isMissingProfesionistiColumn(error: MaybeError, column: string): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  const col = column.toLowerCase();
  if (!message.includes(col)) return false;
  if (message.includes("schema cache")) return true;
  if (message.includes("does not exist")) return true;
  return false;
}

export function isMissingProfesionistiTelefonColumn(error: MaybeError): boolean {
  return isMissingProfesionistiColumn(error, "telefon");
}

export function isMissingProfesionistiWhatsappColumn(error: MaybeError): boolean {
  return isMissingProfesionistiColumn(error, "whatsapp");
}

export async function selectWithTelefonFallback<T>(
  run: (columns: string) => PromiseLike<{ data: T | null; error: MaybeError }>,
  columnsWithTelefon: string,
  columnsWithoutTelefon: string
): Promise<{ data: T | null; error: MaybeError; telefonColumnAvailable: boolean }> {
  const first = await run(columnsWithTelefon);
  if (!isMissingProfesionistiTelefonColumn(first.error)) {
    return { ...first, telefonColumnAvailable: true };
  }

  const fallback = await run(columnsWithoutTelefon);
  return { ...fallback, telefonColumnAvailable: false };
}

export async function writeWithTelefonFallback(
  run: (values: Record<string, unknown>) => PromiseLike<{ error: MaybeError }>,
  valuesWithTelefon: Record<string, unknown>
): Promise<{ error: MaybeError; telefonColumnAvailable: boolean }> {
  const first = await run(valuesWithTelefon);
  if (!isMissingProfesionistiTelefonColumn(first.error)) {
    return { ...first, telefonColumnAvailable: true };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { telefon: _telefon, ...fallbackValues } = valuesWithTelefon;
  const fallback = await run(fallbackValues);
  return { ...fallback, telefonColumnAvailable: false };
}

export async function selectWithWhatsappFallback<T>(
  run: (columns: string) => PromiseLike<{ data: T | null; error: MaybeError }>,
  columnsWithWhatsapp: string,
  columnsWithoutWhatsapp: string
): Promise<{ data: T | null; error: MaybeError; whatsappColumnAvailable: boolean }> {
  const first = await run(columnsWithWhatsapp);
  if (!isMissingProfesionistiWhatsappColumn(first.error)) {
    return { ...first, whatsappColumnAvailable: true };
  }

  const fallback = await run(columnsWithoutWhatsapp);
  return { ...fallback, whatsappColumnAvailable: false };
}

export async function writeWithWhatsappFallback(
  run: (values: Record<string, unknown>) => PromiseLike<{ error: MaybeError }>,
  valuesWithWhatsapp: Record<string, unknown>
): Promise<{ error: MaybeError; whatsappColumnAvailable: boolean }> {
  const first = await run(valuesWithWhatsapp);
  if (!isMissingProfesionistiWhatsappColumn(first.error)) {
    return { ...first, whatsappColumnAvailable: true };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { whatsapp: _whatsapp, ...fallbackValues } = valuesWithWhatsapp;
  const fallback = await run(fallbackValues);
  return { ...fallback, whatsappColumnAvailable: false };
}