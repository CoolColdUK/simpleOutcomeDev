import {NextResponse} from 'next/server';
import {revertSite} from '@/lib/admin/publishSite';
import {requireAdminHostApi} from '@/lib/admin/requireAdminHost';
import {canManageSite, loadOwnedSiteBySlug} from '@/lib/admin/siteAccess';
import {loadSiteSession} from '@/lib/admin/siteSession';
import {readSiteSessionCookie} from '@/lib/admin/siteSessionCookie';

interface RouteParams {
  params: Promise<{slug: string}>;
}

export async function POST(request: Request, {params}: RouteParams): Promise<Response> {
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
  const body = (await request.json().catch(() => undefined)) as {versionNumber?: unknown} | undefined;
  const versionNumber = typeof body?.versionNumber === 'number' ? body.versionNumber : Number(body?.versionNumber);
  if (!Number.isInteger(versionNumber) || versionNumber < 1) {
    return NextResponse.json({error: 'versionNumber is required'}, {status: 400});
  }
  try {
    const result = await revertSite(site.id, versionNumber, session.user.id);
    return NextResponse.json({ok: true, ...result});
  } catch (err) {
    return NextResponse.json({error: err instanceof Error ? err.message : 'Revert failed'}, {status: 400});
  }
}
