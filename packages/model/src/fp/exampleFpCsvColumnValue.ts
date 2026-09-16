export default function exampleFpCsvColumnValue(
  rows: readonly Record<string, string>[],
  column: string,
): string | undefined {
  const values = rows.flatMap((row) => {
    const value = (row[column] ?? '').trim();
    return value === '' ? [] : [value];
  });
  return values[0];
}
