import AdminBrand from '@/components/admin/AdminBrand';
import AdminResetPasswordForm from '@/components/admin/AdminResetPasswordForm';
import {requireAdminHostPage} from '@/lib/admin/requireAdminHost';


export const dynamic = 'force-dynamic';

export const metadata = {title: 'Reset password', robots: {index: false, follow: false}};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{token?: string}>;
}) {
  await requireAdminHostPage();
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : '';
  return (
    <div className="admin">
      <div className="admin-shell">
        <div className="admin-card">
          <div className="admin-auth-brand">
            <AdminBrand />
          </div>
          <h1>Set password</h1>
          {token.length === 0 ? <p className="admin-error">Reset link is missing or invalid.</p> : null}
          <AdminResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}
