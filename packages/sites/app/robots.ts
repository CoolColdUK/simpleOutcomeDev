import type {MetadataRoute} from 'next';
import {resolveSiteHost} from '@so/model';
import {readSitesPublicEnv} from '@/lib/env';
import {loadSiteForHostCached} from '@/lib/site/loadSiteForHost';
import readRequestHost from '@/lib/site/readRequestHost';
import siteIsIndexable from '@/lib/site/siteIsIndexable';

export const dynamic = 'force-dynamic';

function sitemapUrl(host: string): string {
  const hostname = host.split(':')[0] ?? host;
  return `https://${hostname}/sitemap.xml`;
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = await readRequestHost();
  const env = readSitesPublicEnv();
  const resolved = resolveSiteHost({host, rootDomain: env.rootDomain});
  const site = resolved.kind === 'unknown' ? undefined : await loadSiteForHostCached(host);
  if (!siteIsIndexable(resolved.kind, site?.status)) {
    return {rules: {userAgent: '*', disallow: '/'}};
  }
  return {rules: {userAgent: '*', allow: '/'}, sitemap: sitemapUrl(host)};
}
