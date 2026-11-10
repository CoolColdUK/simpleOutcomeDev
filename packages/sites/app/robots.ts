import type {MetadataRoute} from 'next';
import {headers} from 'next/headers';
import {resolveSiteHost} from '@so/model';
import {readSitesPublicEnv} from '@/lib/env';
import {loadSiteForHostCached} from '@/lib/site/loadSiteForHost';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerList = await headers();
  const host = headerList.get('x-site-host') ?? headerList.get('host') ?? '';
  const env = readSitesPublicEnv();
  const resolved = resolveSiteHost({host, rootDomain: env.rootDomain});
  if (resolved.kind === 'demo-subdomain' || resolved.kind === 'local' || resolved.kind === 'unknown') {
    return {rules: {userAgent: '*', disallow: '/'}};
  }
  const site = await loadSiteForHostCached(host);
  if (!site || site.status === 'demo') {
    return {rules: {userAgent: '*', disallow: '/'}};
  }
  return {rules: {userAgent: '*', allow: '/'}};
}
