import type {MetadataRoute} from 'next';
import {resolveSiteHost} from '@so/model';
import {readSitesPublicEnv} from '@/lib/env';
import {loadSiteForHostCached} from '@/lib/site/loadSiteForHost';
import readRequestHost from '@/lib/site/readRequestHost';
import siteIsIndexable from '@/lib/site/siteIsIndexable';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = await readRequestHost();
  const env = readSitesPublicEnv();
  const resolved = resolveSiteHost({host, rootDomain: env.rootDomain});
  const site = resolved.kind === 'unknown' ? undefined : await loadSiteForHostCached(host);
  if (!siteIsIndexable(resolved.kind, site?.status) || site?.customDomain === undefined) {
    return [];
  }
  return [{url: `https://${site.customDomain}/`, changeFrequency: 'monthly'}];
}
