import {NextResponse} from 'next/server';
import {requireAdminHostApi} from '@/lib/admin/requireAdminHost';
import {actingIsAdmin} from '@/lib/admin/requireSiteSession';
import {loadSiteSession, type SiteSessionContext} from '@/lib/admin/siteSession';
import {readSiteSessionCookie} from '@/lib/admin/siteSessionCookie';

export async function requireAdminApi(): Promise<SiteSessionContext | Response> {
  const blocked = await requireAdminHostApi();
  if (blocked !== undefined) {
    return blocked;
  }
  const raw = await readSiteSessionCookie();
  if (raw === undefined) {
    return NextResponse.json({error: 'Sign in required'}, {status: 401});
  }
  const session = await loadSiteSession(raw);
  if (session === undefined) {
    return NextResponse.json({error: 'Sign in required'}, {status: 401});
  }
  if (!actingIsAdmin(session)) {
    return NextResponse.json({error: 'Admin only'}, {status: 403});
  }
  return session;
}

export function adminApiDenied(result: SiteSessionContext | Response): result is Response {
  return result instanceof Response;
}
