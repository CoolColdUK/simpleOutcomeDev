export interface SitesSupabaseEnv {
  readonly url: string;
  readonly anonKey: string;
}

export interface SitesPublicEnv {
  readonly rootDomain: string;
  readonly salesEmail: string;
  readonly supabase: SitesSupabaseEnv | undefined;
}

const DEFAULT_ROOT_DOMAIN = 'simpleoutcome.dev';
const DEFAULT_SALES_EMAIL = 'info@simpleoutcome.dev';

function readSalesEmail(): string {
  const email = process.env.SITES_SALES_EMAIL?.trim();
  if (email === undefined || email.length === 0) {
    return DEFAULT_SALES_EMAIL;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('SITES_SALES_EMAIL is not an email address');
  }
  return email;
}

function readSupabase(): SitesSupabaseEnv | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const hasUrl = url !== undefined && url.length > 0;
  const hasKey = anonKey !== undefined && anonKey.length > 0;
  if (!hasUrl && !hasKey) {
    return undefined;
  }
  if (!hasUrl || !hasKey || url === undefined || anonKey === undefined) {
    throw new Error('Set both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or neither for local file demos');
  }
  return {url, anonKey};
}

export function readSitesPublicEnv(): SitesPublicEnv {
  const rootDomain = process.env.NEXT_PUBLIC_SITES_ROOT_DOMAIN?.trim();
  return {
    rootDomain: rootDomain === undefined || rootDomain.length === 0 ? DEFAULT_ROOT_DOMAIN : rootDomain,
    salesEmail: readSalesEmail(),
    supabase: readSupabase(),
  };
}
