import {NextResponse} from 'next/server';
import {verifyPassword} from '@/lib/admin/hashPassword';
import {requireAdminHostApi} from '@/lib/admin/requireAdminHost';
import {createSiteSession} from '@/lib/admin/siteSession';
import {writeSiteSessionCookie} from '@/lib/admin/siteSessionCookie';
import createSitesServiceClient from '@/lib/supabase/createSitesServiceClient';

export async function POST(request: Request): Promise<Response> {
  const blocked = await requireAdminHostApi();
  if (blocked !== undefined) {
    return blocked;
  }
  const body = (await request.json().catch(() => undefined)) as {email?: unknown; password?: unknown} | undefined;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (email.length === 0 || password.length === 0) {
    return NextResponse.json({error: 'Email and password are required'}, {status: 400});
  }
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase
    .from('site_user')
    .select('id, email, password_hash, is_admin')
    .eq('email', email)
    .maybeSingle();
  if (error) {
    return NextResponse.json({error: 'Could not sign in'}, {status: 500});
  }
  if (data === null) {
    return NextResponse.json({error: 'Invalid email or password'}, {status: 401});
  }
  const row = data as {id: string; email: string; password_hash: string | null; is_admin: boolean};
  if (row.password_hash === null) {
    return NextResponse.json(
      {error: 'Set a password with Forgot password before signing in'},
      {status: 401},
    );
  }
  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) {
    return NextResponse.json({error: 'Invalid email or password'}, {status: 401});
  }
  const raw = await createSiteSession(row.id);
  await writeSiteSessionCookie(raw);
  return NextResponse.json({ok: true});
}
