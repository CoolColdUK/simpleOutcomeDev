import {extractSoImageObjectPathsFromBody} from '../todo/soImageMarkdownUri';

const SO_IMAGE_IN_MARKDOWN = /!\[[^\]]*\]\(soimg:([^)]+)\)/g;

function objectPathMatchesEncoded(objectPath: string, encoded: string): boolean {
  try {
    return decodeURIComponent(encoded) === objectPath;
  } catch {
    return false;
  }
}

export default function removeSoImageMarkdownForObjectPath(body: string, objectPath: string): string {
  const stripped = body.replace(SO_IMAGE_IN_MARKDOWN, (match, encoded: string) =>
    objectPathMatchesEncoded(objectPath, encoded) ? '' : match,
  );
  if (extractSoImageObjectPathsFromBody(stripped).includes(objectPath)) {
    return stripped;
  }
  return stripped.replace(/\n{3,}/g, '\n\n').trimEnd();
}
