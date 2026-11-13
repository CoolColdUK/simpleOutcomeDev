import AdminForgotPasswordForm from '@/components/admin/AdminForgotPasswordForm';
import {requireAdminHostPage} from '@/lib/admin/requireAdminHost';


export const dynamic = 'force-dynamic';

export const metadata = {title: 'Forgot password', robots: {index: false, follow: false}};

export default async function ForgotPasswordPage() {
  await requireAdminHostPage();
  return (
    <div className="admin">
      <div className="admin-shell">
        <div className="admin-card">
          <h1>Forgot password</h1>
          <p className="admin-muted">We email a reset link to the address on the site account. First login uses this to set a password.</p>
          <AdminForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
