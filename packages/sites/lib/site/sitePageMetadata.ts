import type {Metadata} from 'next';
import {siteSeoDescription, siteSeoTitle, type SiteDocument} from '@so/model';

export interface SitePageMetadataInput {
  readonly host: string;
  readonly indexable: boolean;
  readonly document: SiteDocument | undefined;
}

function requestOrigin(host: string): URL {
  const trimmed = host.trim();
  if (trimmed.length === 0) {
    return new URL('http://localhost:3001');
  }
  const local = trimmed.includes('localhost') || trimmed.startsWith('127.0.0.1');
  return new URL(`${local ? 'http' : 'https'}://${trimmed}`);
}

export default function sitePageMetadata(input: SitePageMetadataInput): Metadata {
  const title = input.document === undefined ? 'Site not found' : siteSeoTitle(input.document);
  const description = input.document === undefined ? undefined : siteSeoDescription(input.document);
  const origin = requestOrigin(input.host);
  const pageUrl = `${origin.origin}/`;
  const image = input.document?.seo?.ogImageUrl;
  return {
    metadataBase: origin,
    title,
    description,
    alternates: {canonical: pageUrl},
    robots: input.indexable ? {index: true, follow: true} : {index: false, follow: false},
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_GB',
      url: pageUrl,
      images: image === undefined ? undefined : [{url: image, alt: title}],
    },
    twitter: {
      card: image === undefined ? 'summary' : 'summary_large_image',
      title,
      description,
      images: image === undefined ? undefined : [image],
    },
  };
}
