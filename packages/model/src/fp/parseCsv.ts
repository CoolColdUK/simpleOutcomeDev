export default function parseCsv(text: string, delimiter = ','): readonly (readonly string[])[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const input = text.replace(/^\uFEFF/, '');

  const pushField = (): void => {
    row.push(field);
    field = '';
  };

  const pushRow = (): void => {
    pushField();
    if (row.some((cell) => cell !== '')) {
      rows.push(row);
    }
    row = [];
  };

  const chars = [...input];
  chars.forEach((ch, i) => {
    const next = chars[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        chars[i + 1] = '';
        return;
      }
      if (ch === '"') {
        inQuotes = false;
        return;
      }
      field += ch;
      return;
    }
    if (ch === '"') {
      inQuotes = true;
      return;
    }
    if (ch === delimiter) {
      pushField();
      return;
    }
    if (ch === '\n') {
      pushRow();
      return;
    }
    if (ch === '\r') {
      return;
    }
    if (ch !== '') {
      field += ch;
    }
  });
  if (field !== '' || row.length > 0) {
    pushRow();
  }
  return rows;
}
