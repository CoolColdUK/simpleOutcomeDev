/** Plain-text preview for asset cards (no markdown rendering). */
export default function bookAssetDescriptionSnippet(descriptionMd: string, maxLength = 140): string {
  const stripped = descriptionMd
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (stripped.length <= maxLength) {
    return stripped;
  }
  return `${stripped.slice(0, maxLength).trimEnd()}…`;
}
