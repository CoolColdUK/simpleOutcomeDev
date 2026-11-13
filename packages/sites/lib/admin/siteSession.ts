import createSitesServiceClient from '@/lib/supabase/createSitesServiceClient';
import {createRawToken, hashToken} from '@/lib/admin/hashToken';
import {SITE_SESSION_DAYS} from '@/lib/admin/siteSessionCookie';

export interface SiteUserRow {
  readonly id: string;
  readonly email: string;
  readonly password_hash: string | null;
  readonly is_admin: boolean;
}

export interface SiteSessionContext {
  readonly sessionId: string;
  readonly user: SiteUserRow;
  readonly impersonator: SiteUserRow | undefined;
}

function mapUser(row: {
  id: string;
  email: string;
  password_hash: string | null;
  is_admin: boolean;
}): SiteUserRow {
  return {
    id: row.id,
    email: row.email,
    password_hash: row.password_hash,
    is_admin: row.is_admin,
  };
}

export async function createSiteSession(userId: string, impersonatorId?: string): Promise<string> {
  const supabase = createSitesServiceClient();
  const raw = createRawToken();
  const expiresAt = new Date(Date.now() + SITE_SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const {error} = await supabase.from('site_session').insert({
    token_hash: hashToken(raw),
    user_id: userId,
    impersonator_id: impersonatorId ?? null,
    expires_at: expiresAt,
  });
  if (error) {
    throw new Error('Could not create session');
  }
  return raw;
}

export async function deleteSiteSessionByToken(rawToken: string): Promise<void> {
  const supabase = createSitesServiceClient();
  await supabase.from('site_session').delete().eq('token_hash', hashToken(rawToken));
}

export async function deleteAllSessionsForUser(userId: string): Promise<void> {
  const supabase = createSitesServiceClient();
  await supabase.from('site_session').delete().eq('user_id', userId);
  await supabase.from('site_session').delete().eq('impersonator_id', userId);
}

export async function loadSiteSession(rawToken: string): Promise<SiteSessionContext | undefined> {
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase
    .from('site_session')
    .select('id, user_id, impersonator_id, expires_at')
    .eq('token_hash', hashToken(rawToken))
    .maybeSingle();
  if (error || data === null) {
    return undefined;
  }
  const row = data as {
    id: string;
    user_id: string;
    impersonator_id: string | null;
    expires_at: string;
  };
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await supabase.from('site_session').delete().eq('id', row.id);
    return undefined;
  }
  const {data: userData, error: userError} = await supabase
    .from('site_user')
    .select('id, email, password_hash, is_admin')
    .eq('id', row.user_id)
    .maybeSingle();
  if (userError || userData === null) {
    return undefined;
  }
  let impersonator: SiteUserRow | undefined;
  if (row.impersonator_id !== null) {
    const {data: adminData} = await supabase
      .from('site_user')
      .select('id, email, password_hash, is_admin')
      .eq('id', row.impersonator_id)
      .maybeSingle();
    if (adminData !== null) {
      impersonator = mapUser(adminData as SiteUserRow);
    }
  }
  return {
    sessionId: row.id,
    user: mapUser(userData as SiteUserRow),
    impersonator,
  };
}

export async function updateSessionUser(sessionId: string, userId: string, impersonatorId: string | null): Promise<void> {
  const supabase = createSitesServiceClient();
  const {error} = await supabase
    .from('site_session')
    .update({user_id: userId, impersonator_id: impersonatorId})
    .eq('id', sessionId);
  if (error) {
    throw new Error('Could not update session');
  }
}
