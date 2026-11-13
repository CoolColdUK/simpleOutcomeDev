import {redirect} from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import AdminUsersPanel from '@/components/admin/AdminUsersPanel';
import {requireAdminHostPage} from '@/lib/admin/requireAdminHost';
import {actingIsAdmin, requireSiteSession} from '@/lib/admin/requireSiteSession';
import createSitesServiceClient from '@/lib/supabase/createSitesServiceClient';


export const dynamic = 'force-dynamic';

export const metadata = {title: 'Users', robots: {index: false, follow: false}};

export default async function UsersPage() {
  await requireAdminHostPage();
  const session = await requireSiteSession();
  if (!actingIsAdmin(session)) {
    redirect('/');
  }
  const supabase = createSitesServiceClient();
  const {data} = await supabase.from('site_user').select('id, email, is_admin').order('email');
  return (
    <AdminShell session={session}>
      <AdminUsersPanel users={(data ?? []) as {id: string; email: string; is_admin: boolean}[]} />
    </AdminShell>
  );
}
