export const SO_IMAGE_MARKDOWN_URI_PREFIX = 'soimg:' as const;

const SO_IMAGE_IN_MARKDOWN = /!\[[^\]]*\]\(soimg:([^)]+)\)/g;

export function encodeSoImageMarkdownUri(objectPath: string): string {
  return `${SO_IMAGE_MARKDOWN_URI_PREFIX}${encodeURIComponent(objectPath)}`;
}

export function decodeSoImageMarkdownUri(src: string): string | undefined {
  const t = src.trim();
  if (!t.startsWith(SO_IMAGE_MARKDOWN_URI_PREFIX)) {
    return undefined;
  }
  const encoded = t.slice(SO_IMAGE_MARKDOWN_URI_PREFIX.length);
  try {
    return decodeURIComponent(encoded);
  } catch {
    return undefined;
  }
}

export function countSoImageMarkdownUrisInBody(body: string): number {
  return [...body.matchAll(/!\[[^\]]*\]\(soimg:([^)]+)\)/g)].length;
}

export function extractSoImageObjectPathsFromBody(body: string): string[] {
  const paths: string[] = [];
  const seen = new Set<string>();
  body.replace(SO_IMAGE_IN_MARKDOWN, (_m, encoded: string) => {
    try {
      const decoded = decodeURIComponent(encoded);
      if (!seen.has(decoded)) {
        seen.add(decoded);
        paths.push(decoded);
      }
    } catch {
      /* skip malformed */
    }
    return '';
  });
  return paths;
}
