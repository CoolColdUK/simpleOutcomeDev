import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';

export interface ListTpAttachmentsInput {
  readonly podId: string;
  readonly transportId?: string;
  readonly destinationId?: string;
}

export default async function listDbTpAttachments(
  supabase: SupabaseClient<Database>,
  input: ListTpAttachmentsInput,
) {
  let query = supabase
    .from('tp_attachment')
    .select('*')
    .eq('pod_id', input.podId);
  
  if (input.transportId) {
    query = query.eq('transport_id', input.transportId);
  }
  
  if (input.destinationId) {
    query = query.eq('destination_id', input.destinationId);
  }
  
  return query.order('created_at', {ascending: false});
}
