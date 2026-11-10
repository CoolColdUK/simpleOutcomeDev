import {randomUUID} from 'node:crypto';
import {bookImageExtensionForMime, type BookImageMime} from './bookImageMime';

export default function buildBookCoverObjectPath(podId: string, mime: BookImageMime): string {
  const ext = bookImageExtensionForMime(mime);
  return `${podId}/book/cover-${randomUUID()}.${ext}`;
}
