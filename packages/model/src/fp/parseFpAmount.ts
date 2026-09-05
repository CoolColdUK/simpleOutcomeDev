export default function parseFpAmount(value: string): number | undefined {
  const normalized = value.replace(/,/g, '').trim();
  if (normalized === '') {
    return undefined;
  }
  const n = Number(normalized);
  if (Number.isNaN(n)) {
    return undefined;
  }
  return n;
}
