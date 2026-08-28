import type {SpaceInviteMode} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface DbSpaceInvite {
  readonly id: string;
  readonly mode: SpaceInviteMode;
  readonly expiresAt: string | undefined;
  readonly createdAt: string;
  readonly disabledAt: string | undefined;
  readonly consumedAt: string | undefined;
}

export default async function listDbSpaceInvites(spaceId: string): Promise<readonly DbSpaceInvite[]> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('space_invite')
    .select('id, mode, expires_at, created_at, disabled_at, consumed_at')
    .eq('space_id', spaceId)
    .order('created_at', {ascending: false});
  throwIfSupabaseError(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    mode: row.mode as SpaceInviteMode,
    expiresAt: row.expires_at ?? undefined,
    createdAt: row.created_at,
    disabledAt: row.disabled_at ?? undefined,
    consumedAt: row.consumed_at ?? undefined,
  }));
}
