import type {ReactNode} from 'react';
import type {SiteSessionContext} from '@/lib/admin/siteSession';
import AdminImpersonationBanner from '@/components/admin/AdminImpersonationBanner';
import AdminLogoutButton from '@/components/admin/AdminLogoutButton';

export default function AdminShell({
  session,
  children,
}: {
  session: SiteSessionContext;
  children: ReactNode;
}) {
  const admin = session.impersonator === undefined && session.user.is_admin;
  return (
    <div className="admin">
      <div className="admin-shell">
        {session.impersonator !== undefined ? (
          <AdminImpersonationBanner email={session.user.email} />
        ) : null}
        <nav className="admin-nav">
          <div className="admin-nav-links">
            <a href="/">Sites</a>
            <a href="/change-password">Password</a>
            {admin ? <a href="/users">Users</a> : null}
            {admin ? <a href="/api-keys">API keys</a> : null}
          </div>
          <div className="admin-nav-links">
            <span className="admin-muted">{session.user.email}</span>
            <AdminLogoutButton />
          </div>
        </nav>
        {children}
      </div>
    </div>
  );
}
