import {notFound} from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import AdminVersionsPanel from '@/components/admin/AdminVersionsPanel';
import {listRevisions} from '@/lib/admin/publishSite';
import {requireAdminHostPage} from '@/lib/admin/requireAdminHost';
import {requireSiteSession} from '@/lib/admin/requireSiteSession';
import {canManageSite, loadOwnedSiteBySlug} from '@/lib/admin/siteAccess';


export const dynamic = 'force-dynamic';

export const metadata = {title: 'Versions', robots: {index: false, follow: false}};

export default async function VersionsPage({params}: {params: Promise<{slug: string}>}) {
  await requireAdminHostPage();
  const session = await requireSiteSession();
  const {slug} = await params;
  const site = await loadOwnedSiteBySlug(slug);
  if (site === undefined || !canManageSite(session, site)) {
    notFound();
  }
  const revisions = await listRevisions(site.id);
  return (
    <AdminShell session={session}>
      <AdminVersionsPanel
        slug={site.slug}
        revisions={revisions.map((row) => ({
          versionNumber: row.version_number,
          publishedAt: row.published_at,
          publishedBy: row.published_by,
          businessName: row.document.businessName,
        }))}
      />
    </AdminShell>
  );
}
