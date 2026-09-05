import {parseFpCurrency, type FpPermissionMatrix} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function updateDbFpSetting(
  podId: string,
  input: {readonly currency?: string; readonly permission?: FpPermissionMatrix},
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const patch: {currency?: string; permission?: FpPermissionMatrix} = {};
  if (input.currency !== undefined) {
    patch.currency = parseFpCurrency(input.currency);
  }
  if (input.permission !== undefined) {
    patch.permission = input.permission;
  }
  const {error} = await supabase.from('fp_setting').update(patch as {currency?: string; permission?: Record<string, unknown>}).eq('pod_id', podId);
  throwIfSupabaseError(error);
}
