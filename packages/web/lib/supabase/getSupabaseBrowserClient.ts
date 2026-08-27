import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import {env} from '@/lib/env';

const cache: {client?: SupabaseClient} = {};

/** Browser-only Supabase client (uses `NEXT_PUBLIC_*` via env.publicSupabase). */
export default function getSupabaseBrowserClient(): SupabaseClient {
  if (cache.client) {
    return cache.client;
  }
  const {url, anonKey} = env.publicSupabase;
  cache.client = createClient(url, anonKey);
  return cache.client;
}
