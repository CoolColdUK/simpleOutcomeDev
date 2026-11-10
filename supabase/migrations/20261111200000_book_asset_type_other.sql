-- Seed "Other" system asset type on new book pods and backfill existing pods.

create or replace function app_private.bk_seed_pod(p_pod_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.bk_book (pod_id) values (p_pod_id);
  insert into public.bk_asset_type (pod_id, slug, label, sort_order, is_system) values
    (p_pod_id, 'characters', 'Characters', 0, true),
    (p_pod_id, 'items', 'Items', 1, true),
    (p_pod_id, 'locations', 'Locations', 2, true),
    (p_pod_id, 'other', 'Other', 3, true);
end;
$$;

insert into public.bk_asset_type (pod_id, slug, label, sort_order, is_system)
select p.id, 'other', 'Other', 3, true
from public.pod p
where p.feature = 'book'
  and not exists (
    select 1 from public.bk_asset_type t where t.pod_id = p.id and t.slug = 'other'
  );
