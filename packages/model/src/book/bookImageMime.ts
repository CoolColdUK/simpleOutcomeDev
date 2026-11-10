export enum BookImageMime {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  WEBP = 'image/webp',
}

export function normalizeBookImageMimeFromBlobType(type: string): BookImageMime | undefined {
  if (type === BookImageMime.JPEG || type === 'image/jpg') {
    return BookImageMime.JPEG;
  }
  if (type === BookImageMime.PNG) {
    return BookImageMime.PNG;
  }
  if (type === BookImageMime.WEBP) {
    return BookImageMime.WEBP;
  }
  return undefined;
}

export function bookImageExtensionForMime(mime: BookImageMime): 'jpg' | 'png' | 'webp' {
  if (mime === BookImageMime.PNG) {
    return 'png';
  }
  if (mime === BookImageMime.WEBP) {
    return 'webp';
  }
  return 'jpg';
}
