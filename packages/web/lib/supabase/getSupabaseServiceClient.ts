import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import {env} from '@/lib/env';
import type {Database} from '@/lib/supabase/database';

export default function getSupabaseServiceClient(): SupabaseClient<Database> | undefined {
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (secret === undefined || secret === '') {
    return undefined;
  }
  return createClient<Database>(env.publicSupabase.url, secret, {
    auth: {persistSession: false, autoRefreshToken: false},
  });
}
