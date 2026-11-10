import {bookImageExtensionForMime, type BookImageMime} from './bookImageMime';

export default function buildBookOutlineImageObjectPath(
  podId: string,
  entryId: string,
  mime: BookImageMime,
  unixMs: string = String(Date.now()),
): string {
  const ext = bookImageExtensionForMime(mime);
  return `${podId}/book/outline/${entryId}/img-${unixMs}.${ext}`;
}
