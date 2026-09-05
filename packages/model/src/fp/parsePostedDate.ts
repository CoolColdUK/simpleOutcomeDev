const TOKEN = /(YYYY|MM|DD|HH|mm|ss)/g;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export default function parsePostedDate(value: string, format: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed === '') {
    return undefined;
  }
  const tokenMatches = format.match(TOKEN);
  if (tokenMatches === undefined) {
    return undefined;
  }
  let rest = trimmed;
  let fmt = format;
  const parts: Record<string, string> = {};
  tokenMatches.forEach((token) => {
    const idx = fmt.indexOf(token);
    const literal = fmt.slice(0, idx);
    if (!rest.startsWith(literal)) {
      return;
    }
    rest = rest.slice(literal.length);
    const width = token === 'YYYY' ? 4 : 2;
    parts[token] = rest.slice(0, width);
    rest = rest.slice(width);
    fmt = fmt.slice(idx + token.length);
  });
  const year = Number(parts.YYYY);
  const month = Number(parts.MM);
  const day = Number(parts.DD);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    return undefined;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}
