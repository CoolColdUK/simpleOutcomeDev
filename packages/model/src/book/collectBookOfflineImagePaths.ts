import {extractSoImageObjectPathsFromBody} from '../todo/soImageMarkdownUri';

export interface CollectBookOfflineImagePathsInput {
  readonly coverStoragePath: string | undefined;
  readonly markdownBodies: readonly string[];
  readonly assetGalleryStoragePaths: readonly string[];
  readonly outlineChapterImagePaths?: readonly string[];
}

export default function collectBookOfflineImagePaths(input: CollectBookOfflineImagePathsInput): string[] {
  const paths = new Set<string>();
  input.markdownBodies.forEach((body) => extractSoImageObjectPathsFromBody(body).forEach((path) => paths.add(path)));
  if (input.coverStoragePath !== undefined) {
    paths.add(input.coverStoragePath);
  }
  input.assetGalleryStoragePaths.forEach((path) => paths.add(path));
  input.outlineChapterImagePaths?.forEach((path) => paths.add(path));
  return [...paths];
}
