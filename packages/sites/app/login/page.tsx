import {redirect} from 'next/navigation';
import AdminBrand from '@/components/admin/AdminBrand';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import {requireAdminHostPage} from '@/lib/admin/requireAdminHost';
import {optionalSiteSession} from '@/lib/admin/requireSiteSession';


export const dynamic = 'force-dynamic';

export const metadata = {title: 'Sign in', robots: {index: false, follow: false}};

export default async function LoginPage() {
  await requireAdminHostPage();
  const session = await optionalSiteSession();
  if (session !== undefined) {
    redirect('/');
  }
  return (
    <div className="admin">
      <div className="admin-shell">
        <div className="admin-card">
          <div className="admin-auth-brand">
            <AdminBrand />
          </div>
          <h1>Site admin</h1>
          <p className="admin-muted">Sign in with the email on your site account.</p>
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
