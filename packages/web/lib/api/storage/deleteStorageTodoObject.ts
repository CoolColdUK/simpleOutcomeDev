import {BUCKET_POD_PRIVATE} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';

export default async function deleteStorageTodoObject(objectPath: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.storage.from(BUCKET_POD_PRIVATE).remove([objectPath]);
  if (error !== null) {
    throw new Error(error.message);
  }
}
