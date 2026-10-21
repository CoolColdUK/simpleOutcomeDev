import {deriveApiKeyStatus, type ApiKeyStatus, type ApiKeyStoredStatus} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface DbApiKey {
  readonly id: string;
  readonly name: string;
  readonly prefix: string;
  readonly status: ApiKeyStatus;
  readonly podIds: readonly string[];
  readonly createdAt: string;
  readonly lastUsedAt: string | undefined;
  readonly expiresAt: string | undefined;
}

function storedStatus(status: string): ApiKeyStoredStatus {
  return status === 'revoked' ? 'revoked' : 'active';
}

export default async function listDbApiKeys(spaceId: string): Promise<readonly DbApiKey[]> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('api_key')
    .select('id, name, key_prefix, status, pod_ids, created_at, last_used_at, expires_at')
    .eq('space_id', spaceId)
    .order('created_at', {ascending: false});
  throwIfSupabaseError(error);
  const nowIso = new Date().toISOString();
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    prefix: row.key_prefix,
    status: deriveApiKeyStatus(storedStatus(row.status), row.expires_at ?? undefined, nowIso),
    podIds: row.pod_ids,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at ?? undefined,
    expiresAt: row.expires_at ?? undefined,
  }));
}
