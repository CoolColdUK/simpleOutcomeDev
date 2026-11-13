import {NextResponse} from 'next/server';
import {requireAdminHostApi} from '@/lib/admin/requireAdminHost';
import {actingIsAdmin} from '@/lib/admin/requireSiteSession';
import {loadSiteSession} from '@/lib/admin/siteSession';
import {readSiteSessionCookie} from '@/lib/admin/siteSessionCookie';
import createSitesServiceClient from '@/lib/supabase/createSitesServiceClient';

async function sessionOr401(): Promise<{session: NonNullable<Awaited<ReturnType<typeof loadSiteSession>>>} | {error: Response}> {
  const raw = await readSiteSessionCookie();
  if (raw === undefined) {
    return {error: NextResponse.json({error: 'Sign in required'}, {status: 401})};
  }
  const session = await loadSiteSession(raw);
  if (session === undefined) {
    return {error: NextResponse.json({error: 'Sign in required'}, {status: 401})};
  }
  if (!actingIsAdmin(session)) {
    return {error: NextResponse.json({error: 'Admin only'}, {status: 403})};
  }
  return {session};
}

export async function GET(): Promise<Response> {
  const blocked = await requireAdminHostApi();
  if (blocked !== undefined) {
    return blocked;
  }
  const auth = await sessionOr401();
  if ('error' in auth) {
    return auth.error;
  }
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase.from('site_user').select('id, email, is_admin, created_at').order('email');
  if (error) {
    return NextResponse.json({error: 'Could not list users'}, {status: 500});
  }
  return NextResponse.json({users: data ?? []});
}

export async function POST(request: Request): Promise<Response> {
  const blocked = await requireAdminHostApi();
  if (blocked !== undefined) {
    return blocked;
  }
  const auth = await sessionOr401();
  if ('error' in auth) {
    return auth.error;
  }
  const body = (await request.json().catch(() => undefined)) as {email?: unknown; isAdmin?: unknown} | undefined;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const isAdmin = body?.isAdmin === true;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({error: 'A valid email is required'}, {status: 400});
  }
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase
    .from('site_user')
    .insert({email, is_admin: isAdmin, password_hash: null})
    .select('id, email, is_admin')
    .single();
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({error: 'That email already has an account'}, {status: 409});
    }
    return NextResponse.json({error: 'Could not create user'}, {status: 500});
  }
  return NextResponse.json({user: data});
}
