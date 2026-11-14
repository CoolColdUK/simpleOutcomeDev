import {redirect} from 'next/navigation';
import {loadSiteSession, type SiteSessionContext} from '@/lib/admin/siteSession';
import {readSiteSessionCookie} from '@/lib/admin/siteSessionCookie';

export async function requireSiteSession(): Promise<SiteSessionContext> {
  const raw = await readSiteSessionCookie();
  if (raw === undefined) {
    redirect('/login');
  }
  let session: SiteSessionContext | undefined;
  try {
    session = await loadSiteSession(raw);
  } catch {
    session = undefined;
  }
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
  try {
    return await loadSiteSession(raw);
  } catch {
    return undefined;
  }
}

export function actingIsAdmin(session: SiteSessionContext): boolean {
  return session.impersonator === undefined && session.user.is_admin;
}
