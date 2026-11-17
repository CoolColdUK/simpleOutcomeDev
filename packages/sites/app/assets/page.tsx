import {redirect} from 'next/navigation';
import AdminAssetsPanel from '@/components/admin/AdminAssetsPanel';
import AdminShell from '@/components/admin/AdminShell';
import {requireAdminHostPage} from '@/lib/admin/requireAdminHost';
import {actingIsAdmin, requireSiteSession} from '@/lib/admin/requireSiteSession';

export const dynamic = 'force-dynamic';

export const metadata = {title: 'Assets', robots: {index: false, follow: false}};

export default async function AssetsPage() {
  await requireAdminHostPage();
  const session = await requireSiteSession();
  if (!actingIsAdmin(session)) {
    redirect('/');
  }
  return (
    <AdminShell session={session}>
      <AdminAssetsPanel />
    </AdminShell>
  );
}
