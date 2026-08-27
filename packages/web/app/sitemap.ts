import type {MetadataRoute} from 'next';
import {env} from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: env.site.webUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
