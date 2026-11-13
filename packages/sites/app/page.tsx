import {isSiteAdminHost, siteBeautySalonJsonLd, resolveSiteHost} from '@so/model';
import Link from 'next/link';
import {notFound, redirect} from 'next/navigation';
import AdminCreateSiteForm from '@/components/admin/AdminCreateSiteForm';
import AdminShell from '@/components/admin/AdminShell';
import SitePageView from '@/components/SitePageView';
import {actingIsAdmin, optionalSiteSession} from '@/lib/admin/requireSiteSession';
import {listSitesForUser} from '@/lib/admin/siteAccess';
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
  if (isSiteAdminHost(host, env.rootDomain)) {
    return {title: 'Site admin', robots: {index: false, follow: false}};
  }
  const resolved = resolveSiteHost({host, rootDomain: env.rootDomain});
  const site = await currentSite();
  return sitePageMetadata({
    host,
    indexable: siteIsIndexable(resolved.kind, site?.status),
    document: site?.document,
  });
}

function jsonLdHtml(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

async function AdminHome() {
  const session = await optionalSiteSession();
  if (session === undefined) {
    redirect('/login');
  }
  const sites = await listSitesForUser(session.user.id, actingIsAdmin(session));
  return (
    <AdminShell session={session}>
      <div className="admin-card">
        <h1>Sites</h1>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Slug</th>
              <th>Status</th>
              <th>Domain</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => (
              <tr key={site.id}>
                <td>{site.slug}</td>
                <td>{site.status}</td>
                <td>{site.custom_domain ?? '—'}</td>
                <td>
                  <Link href={`/sites/${site.slug}/edit`}>Edit</Link>
                  {' · '}
                  <Link href={`/sites/${site.slug}/versions`}>Versions</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sites.length === 0 ? <p className="admin-muted">No sites yet.</p> : null}
      </div>
      {actingIsAdmin(session) ? (
        <div className="admin-card">
          <h2>Create site</h2>
          <AdminCreateSiteForm ownerEmailDefault={session.user.email} />
        </div>
      ) : null}
    </AdminShell>
  );
}

export default async function Page() {
  const host = await readRequestHost();
  const env = readSitesPublicEnv();
  if (isSiteAdminHost(host, env.rootDomain)) {
    return <AdminHome />;
  }
  const resolved = resolveSiteHost({host, rootDomain: env.rootDomain});
  const site = await currentSite();
  if (!site) {
    notFound();
  }
  const origin = host.includes('localhost') || host.startsWith('127.0.0.1') ? `http://${host}/` : `https://${host}/`;
  const jsonLd = siteIsIndexable(resolved.kind, site.status) ? siteBeautySalonJsonLd(site.document, origin) : undefined;
  return (
    <>
      {jsonLd === undefined ? null : (
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLdHtml(jsonLd)}} />
      )}
      <SitePageView site={site} />
    </>
  );
}
