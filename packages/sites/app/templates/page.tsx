import {redirect} from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import AdminTemplatesPanel from '@/components/admin/AdminTemplatesPanel';
import {requireAdminHostPage} from '@/lib/admin/requireAdminHost';
import {actingIsAdmin, requireSiteSession} from '@/lib/admin/requireSiteSession';

export const dynamic = 'force-dynamic';

export const metadata = {title: 'Templates', robots: {index: false, follow: false}};

export default async function TemplatesPage() {
  await requireAdminHostPage();
  const session = await requireSiteSession();
  if (!actingIsAdmin(session)) {
    redirect('/');
  }
  return (
    <AdminShell session={session}>
      <AdminTemplatesPanel />
    </AdminShell>
  );
}
