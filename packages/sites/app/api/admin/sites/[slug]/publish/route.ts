import {NextResponse} from 'next/server';
import {publishSite} from '@/lib/admin/publishSite';
import {requireAdminHostApi} from '@/lib/admin/requireAdminHost';
import {canManageSite, loadOwnedSiteBySlug} from '@/lib/admin/siteAccess';
import {loadSiteSession} from '@/lib/admin/siteSession';
import {readSiteSessionCookie} from '@/lib/admin/siteSessionCookie';

interface RouteParams {
  params: Promise<{slug: string}>;
}

export async function POST(_request: Request, {params}: RouteParams): Promise<Response> {
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
  const {slug} = await params;
  const site = await loadOwnedSiteBySlug(slug);
  if (site === undefined || !canManageSite(session, site)) {
    return NextResponse.json({error: 'Not found'}, {status: 404});
  }
  try {
    const result = await publishSite(site.id, session.user.id);
    return NextResponse.json({ok: true, ...result});
  } catch (err) {
    return NextResponse.json({error: err instanceof Error ? err.message : 'Publish failed'}, {status: 400});
  }
}
