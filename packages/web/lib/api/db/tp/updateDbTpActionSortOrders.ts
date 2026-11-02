import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import {assertTpActionContentUnlocked} from '@/lib/api/db/tp/tpDbLockChecks';

export default async function updateDbTpActionSortOrders(orderedActionIds: readonly string[]): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await Promise.all(orderedActionIds.map((id) => assertTpActionContentUnlocked(supabase, id)));
  await Promise.all(
    orderedActionIds.map((id, index) =>
      supabase.from('tp_action').update({sort_order: index}).eq('id', id).then(({error}) => throwIfSupabaseError(error)),
    ),
  );
}
