const SITE_ASSET_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]{2,8}$/;

export const SITE_ASSET_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'txt', 'md'] as const;

const CONTENT_TYPE: Record<(typeof SITE_ASSET_EXTENSIONS)[number], string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
};

export function parseSiteAssetName(value: string): string {
  const name = value.trim().toLowerCase().replace(/\s+/g, '-');
  if (name.length > 80 || !SITE_ASSET_NAME.test(name)) {
    throw new Error('Asset name must be lowercase words and an extension, such as gel-nails.jpg');
  }
  const extension = name.slice(name.lastIndexOf('.') + 1);
  if (!SITE_ASSET_EXTENSIONS.some((item) => item === extension)) {
    throw new Error('Use a jpg, png, webp, gif, pdf, txt, or md file');
  }
  return name;
}

export function siteAssetContentType(name: string): string {
  const parsed = parseSiteAssetName(name);
  const extension = parsed.slice(parsed.lastIndexOf('.') + 1);
  const match = SITE_ASSET_EXTENSIONS.find((item) => item === extension);
  if (match === undefined) {
    throw new Error('Use a jpg, png, webp, gif, pdf, txt, or md file');
  }
  return CONTENT_TYPE[match];
}

export function siteAssetPath(name: string): string {
  return `/assets/${parseSiteAssetName(name)}`;
}

export type SiteAssetVisibility = 'private' | 'public';

export function parseSiteAssetDescription(value: string): string {
  const description = value.trim().replace(/\s+/g, ' ');
  if (description.length < 1 || description.length > 500) {
    throw new Error('Describe the file in 500 characters or less');
  }
  return description;
}

export function parseSiteAssetVisibility(value: string): SiteAssetVisibility {
  const visibility = value.trim().toLowerCase();
  if (visibility === 'private' || visibility === 'public') {
    return visibility;
  }
  throw new Error('Visibility must be private or public');
}
