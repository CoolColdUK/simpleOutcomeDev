import {redirect} from 'next/navigation';
import AdminDesignLibrary from '@/components/admin/AdminDesignLibrary';
import AdminShell from '@/components/admin/AdminShell';
import {requireAdminHostPage} from '@/lib/admin/requireAdminHost';
import {actingIsAdmin, requireSiteSession} from '@/lib/admin/requireSiteSession';

export const dynamic = 'force-dynamic';

export const metadata = {title: 'Design', robots: {index: false, follow: false}};

export default async function DesignPage() {
  await requireAdminHostPage();
  const session = await requireSiteSession();
  if (!actingIsAdmin(session)) {
    redirect('/');
  }
  return (
    <AdminShell session={session}>
      <AdminDesignLibrary />
    </AdminShell>
  );
}
