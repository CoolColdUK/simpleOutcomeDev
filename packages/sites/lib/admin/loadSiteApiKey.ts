import {hashToken} from '@/lib/admin/hashToken';
import createSitesServiceClient from '@/lib/supabase/createSitesServiceClient';
import type {SiteUserRow} from '@/lib/admin/siteSession';

export async function loadSiteApiKeyUser(authorization: string | null): Promise<SiteUserRow | undefined> {
  if (authorization === null || !authorization.startsWith('Bearer ')) {
    return undefined;
  }
  const secret = authorization.slice('Bearer '.length).trim();
  if (secret.length === 0) {
    return undefined;
  }
  const supabase = createSitesServiceClient();
  const {data: key, error} = await supabase
    .from('site_api_key')
    .select('user_id, revoked_at')
    .eq('token_hash', hashToken(secret))
    .maybeSingle();
  if (error || key === null) {
    return undefined;
  }
  const keyRow = key as {user_id: string; revoked_at: string | null};
  if (keyRow.revoked_at !== null) {
    return undefined;
  }
  const {data: user, error: userError} = await supabase
    .from('site_user')
    .select('id, email, password_hash, is_admin')
    .eq('id', keyRow.user_id)
    .maybeSingle();
  if (userError || user === null) {
    return undefined;
  }
  const row = user as SiteUserRow;
  if (!row.is_admin) {
    return undefined;
  }
  return row;
}
