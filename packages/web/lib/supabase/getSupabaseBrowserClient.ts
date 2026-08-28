import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import {env} from '@/lib/env';
import type {Database} from '@/lib/supabase/database';

const cache: {client?: SupabaseClient<Database>} = {};

/** Browser-only Supabase client (uses `NEXT_PUBLIC_*` via env.publicSupabase). */
export default function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (cache.client) {
    return cache.client;
  }
  const {url, anonKey} = env.publicSupabase;
  cache.client = createClient<Database>(url, anonKey);
  return cache.client;
}
