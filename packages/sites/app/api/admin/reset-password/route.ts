import {NextResponse} from 'next/server';
import {hashPassword, SITE_PASSWORD_MIN_LENGTH} from '@/lib/admin/hashPassword';
import {hashToken} from '@/lib/admin/hashToken';
import {requireAdminHostApi} from '@/lib/admin/requireAdminHost';
import {deleteAllSessionsForUser} from '@/lib/admin/siteSession';
import createSitesServiceClient from '@/lib/supabase/createSitesServiceClient';

export async function POST(request: Request): Promise<Response> {
  const blocked = await requireAdminHostApi();
  if (blocked !== undefined) {
    return blocked;
  }
  const body = (await request.json().catch(() => undefined)) as {
    token?: unknown;
    password?: unknown;
    confirm?: unknown;
  } | undefined;
  const token = typeof body?.token === 'string' ? body.token : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const confirm = typeof body?.confirm === 'string' ? body.confirm : '';
  if (token.length === 0) {
    return NextResponse.json({error: 'Reset link is missing or invalid'}, {status: 400});
  }
  if (password.length < SITE_PASSWORD_MIN_LENGTH) {
    return NextResponse.json({error: `Password must be at least ${SITE_PASSWORD_MIN_LENGTH} characters`}, {status: 400});
  }
  if (password !== confirm) {
    return NextResponse.json({error: 'Passwords do not match'}, {status: 400});
  }
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase
    .from('site_password_reset')
    .select('id, user_id, expires_at')
    .eq('token_hash', hashToken(token))
    .maybeSingle();
  if (error || data === null) {
    return NextResponse.json({error: 'Reset link is missing or invalid'}, {status: 400});
  }
  const row = data as {id: string; user_id: string; expires_at: string};
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await supabase.from('site_password_reset').delete().eq('id', row.id);
    return NextResponse.json({error: 'Reset link has expired'}, {status: 400});
  }
  const passwordHash = await hashPassword(password);
  const {error: updateError} = await supabase.from('site_user').update({password_hash: passwordHash}).eq('id', row.user_id);
  if (updateError) {
    return NextResponse.json({error: 'Could not update password'}, {status: 500});
  }
  await supabase.from('site_password_reset').delete().eq('user_id', row.user_id);
  await deleteAllSessionsForUser(row.user_id);
  return NextResponse.json({ok: true});
}
