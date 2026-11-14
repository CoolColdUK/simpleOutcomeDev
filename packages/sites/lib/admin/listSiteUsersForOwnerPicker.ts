import createSitesServiceClient from '@/lib/supabase/createSitesServiceClient';

export interface SiteUserOwnerOption {
  readonly id: string;
  readonly email: string;
  readonly created_at: string;
}

export async function listSiteUsersForOwnerPicker(input: {
  readonly query?: string;
  readonly limit?: number;
}): Promise<SiteUserOwnerOption[]> {
  const supabase = createSitesServiceClient();
  const limit = Math.min(Math.max(input.limit ?? 5, 1), 20);
  const query = input.query?.trim().toLowerCase() ?? '';

  let userQuery = supabase
    .from('site_user')
    .select('id, email, created_at')
    .eq('is_admin', false)
    .order('created_at', {ascending: false})
    .limit(limit);
  if (query.length > 0) {
    userQuery = userQuery.ilike('email', `%${query}%`);
  }

  const {data, error} = await userQuery;
  if (error) {
    throw new Error(error.message || 'Could not list users');
  }
  return (data ?? []) as SiteUserOwnerOption[];
}
