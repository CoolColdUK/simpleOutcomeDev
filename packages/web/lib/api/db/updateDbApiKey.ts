import type {ApiKeyPermissions} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function updateDbApiKey(id: string, name: string, permissions: ApiKeyPermissions): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.rpc('update_api_key', {
    p_id: id,
    p_name: name,
    p_permissions: JSON.parse(JSON.stringify(permissions)) as Record<string, unknown>,
  });
  throwIfSupabaseError(error);
}
