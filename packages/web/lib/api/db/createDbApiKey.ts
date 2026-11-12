import {type ApiKeyKind, type ApiKeyPermissions} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface CreatedDbApiKey {
  readonly id: string;
  readonly secret: string;
  readonly prefix: string;
}

export default async function createDbApiKey(name: string, permissions: ApiKeyPermissions, kind: ApiKeyKind): Promise<CreatedDbApiKey> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.rpc('create_api_key', {
    p_name: name,
    p_permissions: JSON.parse(JSON.stringify(permissions)) as Record<string, unknown>,
    p_expires_at: null,
    p_kind: kind,
  });
  throwIfSupabaseError(error);
  if (data === undefined || data === null || data.secret === undefined) {
    throw new Error('create_api_key returned no secret');
  }
  return {id: data.id, secret: data.secret, prefix: data.prefix};
}
