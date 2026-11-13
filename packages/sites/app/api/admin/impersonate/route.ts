import {NextResponse} from 'next/server';
import {requireAdminHostApi} from '@/lib/admin/requireAdminHost';
import {actingIsAdmin} from '@/lib/admin/requireSiteSession';
import {loadSiteSession, updateSessionUser} from '@/lib/admin/siteSession';
import {readSiteSessionCookie} from '@/lib/admin/siteSessionCookie';
import createSitesServiceClient from '@/lib/supabase/createSitesServiceClient';

export async function POST(request: Request): Promise<Response> {
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
  const body = (await request.json().catch(() => undefined)) as {userId?: unknown; action?: unknown} | undefined;
  const action = body?.action === 'stop' ? 'stop' : 'start';

  if (action === 'stop') {
    if (session.impersonator === undefined) {
      return NextResponse.json({error: 'Not switched into another account'}, {status: 400});
    }
    await updateSessionUser(session.sessionId, session.impersonator.id, null);
    return NextResponse.json({ok: true});
  }

  if (!actingIsAdmin(session)) {
    return NextResponse.json({error: 'Admin only'}, {status: 403});
  }
  const userId = typeof body?.userId === 'string' ? body.userId : '';
  if (userId.length === 0) {
    return NextResponse.json({error: 'userId is required'}, {status: 400});
  }
  if (userId === session.user.id) {
    return NextResponse.json({error: 'Already that account'}, {status: 400});
  }
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase.from('site_user').select('id').eq('id', userId).maybeSingle();
  if (error || data === null) {
    return NextResponse.json({error: 'User not found'}, {status: 404});
  }
  await updateSessionUser(session.sessionId, userId, session.user.id);
  return NextResponse.json({ok: true});
}
