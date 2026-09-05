export default function matchFpParserIdentifier(headerLine: string, identifier: string | undefined): boolean {
  if (identifier === undefined || identifier.trim() === '') {
    return false;
  }
  return headerLine.trim() === identifier.trim();
}
