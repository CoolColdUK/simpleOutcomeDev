import {notFound} from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import AdminSiteEditor from '@/components/admin/AdminSiteEditor';
import {requireAdminHostPage} from '@/lib/admin/requireAdminHost';
import {requireSiteSession} from '@/lib/admin/requireSiteSession';
import {canManageSite, loadDraftDocument, loadOwnedSiteBySlug} from '@/lib/admin/siteAccess';


export const dynamic = 'force-dynamic';

export const metadata = {title: 'Edit site', robots: {index: false, follow: false}};

export default async function EditSitePage({params}: {params: Promise<{slug: string}>}) {
  await requireAdminHostPage();
  const session = await requireSiteSession();
  const {slug} = await params;
  const site = await loadOwnedSiteBySlug(slug);
  if (site === undefined || !canManageSite(session, site)) {
    notFound();
  }
  const document = await loadDraftDocument(site.id);
  if (document === undefined) {
    notFound();
  }
  return (
    <AdminShell session={session}>
      <AdminSiteEditor
        slug={site.slug}
        status={site.status}
        messagesEnabled={site.messages_enabled}
        document={document}
        customDomain={site.custom_domain ?? undefined}
      />
    </AdminShell>
  );
}
