import type {SpaceRole} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {SpaceListItem} from '@/lib/api/db/spaceListItem';

interface SpaceMemberRow {
  readonly role: string;
  readonly space: {readonly id: string; readonly name: string; readonly description: string | null} | null;
}

export default async function listDbSpaces(userId: string): Promise<readonly SpaceListItem[]> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('space_member')
    .select('role, space:space(id, name, description)')
    .eq('user_id', userId);
  throwIfSupabaseError(error);
  const rows = (data ?? []) as unknown as readonly SpaceMemberRow[];
  return rows.flatMap((row) => {
    if (row.space === null) {
      return [];
    }
    return [
      {
        id: row.space.id,
        name: row.space.name,
        description: row.space.description ?? undefined,
        role: row.role as SpaceRole,
      },
    ];
  });
}
