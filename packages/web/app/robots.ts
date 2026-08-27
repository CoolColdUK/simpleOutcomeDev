import type {MetadataRoute} from 'next';
import {env} from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const {webUrl} = env.site;
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/app', '/login', '/signup'],
    },
    sitemap: `${webUrl}/sitemap.xml`,
  };
}
