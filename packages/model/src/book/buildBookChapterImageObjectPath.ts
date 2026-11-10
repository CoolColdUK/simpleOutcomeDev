import {bookImageExtensionForMime, type BookImageMime} from './bookImageMime';

export default function buildBookChapterImageObjectPath(
  podId: string,
  entryId: string,
  mime: BookImageMime,
  unixMs: string = String(Date.now()),
): string {
  const ext = bookImageExtensionForMime(mime);
  return `${podId}/book/chapters/${entryId}/header-${unixMs}.${ext}`;
}
