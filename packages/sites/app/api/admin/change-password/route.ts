import {NextResponse} from 'next/server';
import {hashPassword, SITE_PASSWORD_MIN_LENGTH, verifyPassword} from '@/lib/admin/hashPassword';
import {requireAdminHostApi} from '@/lib/admin/requireAdminHost';
import {deleteAllSessionsForUser, loadSiteSession} from '@/lib/admin/siteSession';
import {readSiteSessionCookie, writeSiteSessionCookie} from '@/lib/admin/siteSessionCookie';
import {createSiteSession} from '@/lib/admin/siteSession';
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
  if (session.impersonator !== undefined) {
    return NextResponse.json({error: 'Leave the switched account before changing a password'}, {status: 403});
  }
  const body = (await request.json().catch(() => undefined)) as {
    currentPassword?: unknown;
    password?: unknown;
    confirm?: unknown;
  } | undefined;
  const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const confirm = typeof body?.confirm === 'string' ? body.confirm : '';
  if (session.user.password_hash === null) {
    return NextResponse.json({error: 'Set a password with Forgot password first'}, {status: 400});
  }
  if (!(await verifyPassword(currentPassword, session.user.password_hash))) {
    return NextResponse.json({error: 'Current password is incorrect'}, {status: 401});
  }
  if (password.length < SITE_PASSWORD_MIN_LENGTH) {
    return NextResponse.json({error: `Password must be at least ${SITE_PASSWORD_MIN_LENGTH} characters`}, {status: 400});
  }
  if (password !== confirm) {
    return NextResponse.json({error: 'Passwords do not match'}, {status: 400});
  }
  const passwordHash = await hashPassword(password);
  const supabase = createSitesServiceClient();
  const {error} = await supabase.from('site_user').update({password_hash: passwordHash}).eq('id', session.user.id);
  if (error) {
    return NextResponse.json({error: 'Could not update password'}, {status: 500});
  }
  await deleteAllSessionsForUser(session.user.id);
  const next = await createSiteSession(session.user.id);
  await writeSiteSessionCookie(next);
  return NextResponse.json({ok: true});
}
