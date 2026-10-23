export default function tpFormatLocationTime(t: string | undefined): string | undefined {
  if (t === undefined || t === '') {
    return undefined;
  }
  return t.length >= 5 ? t.slice(0, 5) : t;
}
