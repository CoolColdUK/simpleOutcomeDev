import {redirect} from 'next/navigation';
import {loadSiteSession, type SiteSessionContext} from '@/lib/admin/siteSession';
import {readSiteSessionCookie} from '@/lib/admin/siteSessionCookie';

export async function requireSiteSession(): Promise<SiteSessionContext> {
  const raw = await readSiteSessionCookie();
  if (raw === undefined) {
    redirect('/login');
  }
  const session = await loadSiteSession(raw);
  if (session === undefined) {
    redirect('/login');
  }
  return session;
}

export async function optionalSiteSession(): Promise<SiteSessionContext | undefined> {
  const raw = await readSiteSessionCookie();
  if (raw === undefined) {
    return undefined;
  }
  return loadSiteSession(raw);
}

export function actingIsAdmin(session: SiteSessionContext): boolean {
  return session.impersonator === undefined && session.user.is_admin;
}
