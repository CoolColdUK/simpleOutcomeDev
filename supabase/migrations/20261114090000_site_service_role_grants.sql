-- Allow the sites service role to write public.site (create/update/archive).
-- Sites are created by admins and assigned to site_user owners (demos keep owner_id null).

grant all on table public.site to service_role;
