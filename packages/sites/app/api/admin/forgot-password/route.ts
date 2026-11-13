import {NextResponse} from 'next/server';
import {createRawToken, hashToken} from '@/lib/admin/hashToken';
import {adminOrigin, requireAdminHostApi} from '@/lib/admin/requireAdminHost';
import sendPasswordResetEmail from '@/lib/admin/sendPasswordResetEmail';
import createSitesServiceClient from '@/lib/supabase/createSitesServiceClient';
import readRequestHost from '@/lib/site/readRequestHost';

const CONFIRM = {ok: true, message: 'If that email is on a site account, a reset link has been sent.'};

export async function POST(request: Request): Promise<Response> {
  const blocked = await requireAdminHostApi();
  if (blocked !== undefined) {
    return blocked;
  }
  const body = (await request.json().catch(() => undefined)) as {email?: unknown} | undefined;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email.length === 0) {
    return NextResponse.json(CONFIRM);
  }
  const supabase = createSitesServiceClient();
  const {data} = await supabase.from('site_user').select('id, email').eq('email', email).maybeSingle();
  if (data === null) {
    return NextResponse.json(CONFIRM);
  }
  const user = data as {id: string; email: string};
  const raw = createRawToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await supabase.from('site_password_reset').delete().eq('user_id', user.id);
  const {error} = await supabase.from('site_password_reset').insert({
    token_hash: hashToken(raw),
    user_id: user.id,
    expires_at: expiresAt,
  });
  if (error) {
    console.error('site_password_reset insert failed', error.message);
    return NextResponse.json(CONFIRM);
  }
  const host = await readRequestHost();
  const resetUrl = `${adminOrigin(host)}/reset-password?token=${encodeURIComponent(raw)}`;
  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (err) {
    console.error('reset email failed', err instanceof Error ? err.message : err);
  }
  return NextResponse.json(CONFIRM);
}
