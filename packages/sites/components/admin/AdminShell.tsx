import type {ReactNode} from 'react';
import Link from 'next/link';
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
            <Link href="/">Sites</Link>
            <Link href="/change-password">Password</Link>
            {admin ? <Link href="/users">Users</Link> : null}
            {admin ? <Link href="/api-keys">API keys</Link> : null}
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
