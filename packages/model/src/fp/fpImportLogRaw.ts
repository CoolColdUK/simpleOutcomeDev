export default function fpImportLogRaw(row: Record<string, string>): string {
  const text = JSON.stringify(row);
  if (text.length <= 400) {
    return text;
  }
  return `${text.slice(0, 400)}…`;
}
