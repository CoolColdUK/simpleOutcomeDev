import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {resolveSiteHost} from '@so/model';
import SitePageView from '@/components/SitePageView';
import {readSitesPublicEnv} from '@/lib/env';
import {loadSiteForHostCached} from '@/lib/site/loadSiteForHost';

export const dynamic = 'force-dynamic';

async function requestHost(): Promise<string> {
  const headerList = await headers();
  return headerList.get('x-site-host') ?? headerList.get('host') ?? '';
}

async function currentSite() {
  return loadSiteForHostCached(await requestHost());
}

function shouldNoindex(host: string, status: 'demo' | 'live' | undefined): boolean {
  const env = readSitesPublicEnv();
  const resolved = resolveSiteHost({host, rootDomain: env.rootDomain});
  return resolved.kind === 'demo-subdomain' || resolved.kind === 'local' || status === 'demo' || status === undefined;
}

export async function generateMetadata(): Promise<Metadata> {
  const host = await requestHost();
  const site = await currentSite();
  const noindex = shouldNoindex(host, site?.status);
  return {
    title: site?.document.businessName ?? 'Site not found',
    description: site?.document.footer.text,
    robots: noindex ? {index: false, follow: false} : {index: true, follow: true},
  };
}

export default async function Page() {
  const site = await currentSite();
  if (!site) {
    notFound();
  }
  return <SitePageView site={site} />;
}
