import {createClient, type SupabaseClient} from '@supabase/supabase-js';

export default function createSitesServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (url === undefined || url.length === 0 || secret === undefined || secret.length === 0) {
    throw new Error('SUPABASE_SECRET_KEY and NEXT_PUBLIC_SUPABASE_URL are required');
  }
  return createClient(url, secret, {auth: {persistSession: false, autoRefreshToken: false}});
}
