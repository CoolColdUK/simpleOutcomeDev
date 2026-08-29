import {SPACE_INVITE_PAGE_SIZE, SpaceInviteStatus, SpaceInviteStatusFilter} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface DbSpaceInvite {
  readonly id: string;
  readonly tokenPrefix: string;
  readonly expiresAt: string | undefined;
  readonly maxUses: number;
  readonly useCount: number;
  readonly createdAt: string;
  readonly disabledAt: string | undefined;
  readonly consumedAt: string | undefined;
  readonly status: SpaceInviteStatus;
}

export interface DbSpaceInvitePage {
  readonly invites: readonly DbSpaceInvite[];
  readonly total: number;
}

export default async function listDbSpaceInvites(
  spaceId: string,
  status: SpaceInviteStatusFilter,
  page: number,
): Promise<DbSpaceInvitePage> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.rpc('list_space_invites', {
    p_space_id: spaceId,
    p_status: status,
    p_limit: SPACE_INVITE_PAGE_SIZE,
    p_offset: (page - 1) * SPACE_INVITE_PAGE_SIZE,
  });
  throwIfSupabaseError(error);
  const rows = data ?? [];
  return {
    invites: rows.map((row) => ({
      id: row.id,
      tokenPrefix: row.token_prefix,
      expiresAt: row.expires_at ?? undefined,
      maxUses: row.max_uses,
      useCount: row.use_count,
      createdAt: row.created_at,
      disabledAt: row.disabled_at ?? undefined,
      consumedAt: row.consumed_at ?? undefined,
      status: row.invite_status as SpaceInviteStatus,
    })),
    total: rows[0]?.total_count ?? 0,
  };
}
