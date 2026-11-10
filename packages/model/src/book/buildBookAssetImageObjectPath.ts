import {bookImageExtensionForMime, type BookImageMime} from './bookImageMime';

export default function buildBookAssetImageObjectPath(
  podId: string,
  assetId: string,
  mime: BookImageMime,
  unixMs: string = String(Date.now()),
): string {
  const ext = bookImageExtensionForMime(mime);
  return `${podId}/book/assets/${assetId}/img-${unixMs}.${ext}`;
}
