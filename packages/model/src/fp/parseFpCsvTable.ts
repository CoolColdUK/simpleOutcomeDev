import parseCsv from './parseCsv';

export interface FpCsvTable {
  readonly headerLine: string;
  readonly headers: readonly string[];
  readonly rows: readonly Record<string, string>[];
  readonly indexRows: readonly Record<string, string>[];
}

export default function parseFpCsvTable(
  text: string,
  delimiter: string,
  hasHeader: boolean,
  skipRows: number,
): FpCsvTable {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const headerLine = (lines[0] ?? '').trim();
  const grid = parseCsv(text, delimiter);
  const skipped = grid.slice(skipRows);
  if (hasHeader) {
    const headers = skipped[0] ?? [];
    const data = skipped.slice(1);
    const rows = data.map((cells) => {
      const record: Record<string, string> = {};
      headers.forEach((h, i) => {
        record[h] = cells[i] ?? '';
      });
      return record;
    });
    return {headerLine, headers, rows, indexRows: rows};
  }
  const headers = (skipped[0] ?? []).map((_, i) => `Column ${i + 1}`);
  const rows = skipped.map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = cells[i] ?? '';
    });
    return record;
  });
  return {headerLine, headers, rows, indexRows: rows};
}
