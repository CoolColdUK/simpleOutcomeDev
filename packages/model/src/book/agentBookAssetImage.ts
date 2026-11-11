import {BookImageMime} from './bookImageMime';

export const BOOK_MAX_ASSET_IMAGE_BYTES = 10 * 1024 * 1024;

const DATA_URL_BASE64 = /^data:image\/(jpeg|jpg|png);base64,([A-Za-z0-9+/=\s]+)$/i;

export function parseBookAssetImageBase64Payload(imageBase64: string): {readonly base64: string; readonly mimeFromDataUrl?: BookImageMime} {
  const trimmed = imageBase64.trim();
  const match = DATA_URL_BASE64.exec(trimmed);
  if (match === null || match[1] === undefined || match[2] === undefined) {
    return {base64: trimmed};
  }
  const kind = match[1].toLowerCase();
  const mime = kind === 'png' ? BookImageMime.PNG : BookImageMime.JPEG;
  return {base64: match[2].replace(/\s/g, ''), mimeFromDataUrl: mime};
}

export function normalizeAgentBookAssetImageMime(mimeType: string): BookImageMime | undefined {
  const t = mimeType.trim().toLowerCase();
  if (t === 'image/jpeg' || t === 'image/jpg') {
    return BookImageMime.JPEG;
  }
  if (t === 'image/png') {
    return BookImageMime.PNG;
  }
  return undefined;
}

export function assertBookAssetImageObjectPath(podId: string, assetId: string, storagePath: string): boolean {
  const prefix = `${podId}/book/assets/${assetId}/img-`;
  return storagePath.startsWith(prefix) && /\.(jpg|png)$/.test(storagePath);
}
