import {redirect} from 'next/navigation';
import AdminApiKeyForm from '@/components/admin/AdminApiKeyForm';
import AdminShell from '@/components/admin/AdminShell';
import {requireAdminHostPage} from '@/lib/admin/requireAdminHost';
import {actingIsAdmin, requireSiteSession} from '@/lib/admin/requireSiteSession';


export const dynamic = 'force-dynamic';

export const metadata = {title: 'API keys', robots: {index: false, follow: false}};

export default async function ApiKeysPage() {
  await requireAdminHostPage();
  const session = await requireSiteSession();
  if (!actingIsAdmin(session)) {
    redirect('/');
  }
  return (
    <AdminShell session={session}>
      <div className="admin-card">
        <h1>Site MCP API keys</h1>
        <AdminApiKeyForm />
      </div>
    </AdminShell>
  );
}
