import type {ApiKeyPermissions} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface CreatedDbApiKey {
  readonly id: string;
  readonly secret: string;
  readonly prefix: string;
}

export default async function createDbApiKey(
  spaceId: string,
  name: string,
  podIds: readonly string[],
  permissions: ApiKeyPermissions,
): Promise<CreatedDbApiKey> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.rpc('create_api_key', {
    p_space_id: spaceId,
    p_name: name,
    p_pod_ids: [...podIds],
    p_permissions: JSON.parse(JSON.stringify(permissions)) as Record<string, unknown>,
    p_expires_at: null,
  });
  throwIfSupabaseError(error);
  if (data === undefined || data === null || data.secret === undefined) {
    throw new Error('create_api_key returned no secret');
  }
  return {id: data.id, secret: data.secret, prefix: data.prefix};
}
