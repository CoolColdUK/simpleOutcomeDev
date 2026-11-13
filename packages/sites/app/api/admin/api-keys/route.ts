import {NextResponse} from 'next/server';
import {createRawToken, hashToken} from '@/lib/admin/hashToken';
import {requireAdminHostApi} from '@/lib/admin/requireAdminHost';
import {actingIsAdmin} from '@/lib/admin/requireSiteSession';
import {loadSiteSession} from '@/lib/admin/siteSession';
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
  if (!actingIsAdmin(session)) {
    return NextResponse.json({error: 'Admin only'}, {status: 403});
  }
  const body = (await request.json().catch(() => undefined)) as {label?: unknown} | undefined;
  const label = typeof body?.label === 'string' ? body.label.trim() : '';
  if (label.length === 0) {
    return NextResponse.json({error: 'Label is required'}, {status: 400});
  }
  const secret = `sos_${createRawToken()}`;
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase
    .from('site_api_key')
    .insert({token_hash: hashToken(secret), user_id: session.user.id, label})
    .select('id, label, created_at')
    .single();
  if (error) {
    return NextResponse.json({error: 'Could not create API key'}, {status: 500});
  }
  return NextResponse.json({key: data, secret});
}
