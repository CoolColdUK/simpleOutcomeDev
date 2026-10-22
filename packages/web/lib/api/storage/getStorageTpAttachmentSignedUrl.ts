import {BUCKET_POD_PRIVATE} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function getStorageTpAttachmentSignedUrl(storagePath: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.storage.from(BUCKET_POD_PRIVATE).createSignedUrl(storagePath, 60 * 60);
  throwIfSupabaseError(error);
  if (data?.signedUrl === undefined) {
    throw new Error('Could not create download URL');
  }
  return data.signedUrl;
}
