import {extractSoImageObjectPathsFromBody} from '../todo/soImageMarkdownUri';

export interface CollectOutlineEntryImagePathsInput {
  readonly summaryMd: string;
  readonly contentMd: string;
  readonly chapterImageStoragePath?: string;
}

export default function collectOutlineEntryImagePaths(input: CollectOutlineEntryImagePathsInput): string[] {
  const paths = [
    ...extractSoImageObjectPathsFromBody(input.summaryMd),
    ...extractSoImageObjectPathsFromBody(input.contentMd),
  ];
  if (input.chapterImageStoragePath !== undefined && input.chapterImageStoragePath !== '') {
    paths.unshift(input.chapterImageStoragePath);
  }
  return [...new Set(paths)];
}
