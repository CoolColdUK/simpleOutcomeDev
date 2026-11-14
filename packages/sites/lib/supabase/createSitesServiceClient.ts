import {createClient, type SupabaseClient} from '@supabase/supabase-js';

export default function createSitesServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const secret = process.env.SUPABASE_SECRET_KEY?.trim() ?? '';
  if (url.length === 0 && secret.length === 0) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required');
  }
  if (url.length === 0) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  if (secret.length === 0) {
    throw new Error('SUPABASE_SECRET_KEY is required');
  }
  return createClient(url, secret, {auth: {persistSession: false, autoRefreshToken: false}});
}
