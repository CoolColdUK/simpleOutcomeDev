import type {Metadata} from 'next';
import {env} from '@/lib/env';

export function buildDefaultMetadata(): Metadata {
  const site = env.site;

  return {
    metadataBase: new URL(site.webUrl),
    title: {
      default: site.defaultTitle,
      template: `%s | ${site.appName}`,
    },
    description: site.description,
    keywords: site.keywords.split(',').map((k) => k.trim()),
    applicationName: site.appName,
    authors: [{name: site.appName}],
    creator: site.appName,
    publisher: site.appName,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: site.webUrl,
      siteName: site.appName,
      title: site.defaultTitle,
      description: site.description,
    },
    twitter: {
      card: 'summary_large_image',
      title: site.defaultTitle,
      description: site.description,
    },
    robots: {
      index: true,
      follow: true,
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    category: 'technology',
  };
}

export function buildWebsiteJsonLd(): Record<string, unknown> {
  const site = env.site;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.appName,
    url: site.webUrl,
    description: site.description,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'contact@simpleoutcome.dev',
    },
  };
}
