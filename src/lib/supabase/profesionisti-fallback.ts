type MaybeError = { message?: string | null } | null | undefined;

export function isMissingProfesionistiTelefonColumn(error: MaybeError): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  if (!message.includes("telefon")) return false;
  // PostgREST schema-cache miss: "Could not find the 'telefon' column of 'profesionisti' in the schema cache"
  if (message.includes("schema cache")) return true;
  // PostgreSQL direct: "column profesionisti.telefon does not exist"
  if (message.includes("does not exist")) return true;
  return false;
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