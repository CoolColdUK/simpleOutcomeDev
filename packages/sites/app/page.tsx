import {siteBeautySalonJsonLd, resolveSiteHost} from '@so/model';
import {notFound} from 'next/navigation';
import SitePageView from '@/components/SitePageView';
import {readSitesPublicEnv} from '@/lib/env';
import {loadSiteForHostCached} from '@/lib/site/loadSiteForHost';
import readRequestHost from '@/lib/site/readRequestHost';
import siteIsIndexable from '@/lib/site/siteIsIndexable';
import sitePageMetadata from '@/lib/site/sitePageMetadata';

export const dynamic = 'force-dynamic';

async function currentSite() {
  return loadSiteForHostCached(await readRequestHost());
}

export async function generateMetadata() {
  const host = await readRequestHost();
  const env = readSitesPublicEnv();
  const resolved = resolveSiteHost({host, rootDomain: env.rootDomain});
  const site = await currentSite();
  return sitePageMetadata({
    host,
    indexable: siteIsIndexable(resolved.kind, site?.status),
    customDomain: site?.customDomain,
    document: site?.document,
  });
}

function jsonLdHtml(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export default async function Page() {
  const host = await readRequestHost();
  const env = readSitesPublicEnv();
  const resolved = resolveSiteHost({host, rootDomain: env.rootDomain});
  const site = await currentSite();
  if (!site) {
    notFound();
  }
  const canonical = site.customDomain === undefined ? undefined : `https://${site.customDomain}/`;
  const jsonLd =
    siteIsIndexable(resolved.kind, site.status) && canonical !== undefined
      ? siteBeautySalonJsonLd(site.document, canonical)
      : undefined;
  return (
    <>
      {jsonLd === undefined ? null : (
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLdHtml(jsonLd)}} />
      )}
      <SitePageView site={site} />
    </>
  );
}
