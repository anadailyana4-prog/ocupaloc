export function formatLei(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `${n.toFixed(2)} lei`;
}
