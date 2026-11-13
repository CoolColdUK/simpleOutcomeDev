import {redirect} from 'next/navigation';
import AdminChangePasswordForm from '@/components/admin/AdminChangePasswordForm';
import AdminShell from '@/components/admin/AdminShell';
import {requireAdminHostPage} from '@/lib/admin/requireAdminHost';
import {requireSiteSession} from '@/lib/admin/requireSiteSession';


export const dynamic = 'force-dynamic';

export const metadata = {title: 'Change password', robots: {index: false, follow: false}};

export default async function ChangePasswordPage() {
  await requireAdminHostPage();
  const session = await requireSiteSession();
  if (session.impersonator !== undefined) {
    redirect('/');
  }
  return (
    <AdminShell session={session}>
      <div className="admin-card">
        <h1>Change password</h1>
        <AdminChangePasswordForm />
      </div>
    </AdminShell>
  );
}
