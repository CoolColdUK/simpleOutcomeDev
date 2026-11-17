-- What a client file is, and whether the website may show it.

alter table public.site_asset
  add column description text,
  add column visibility text not null default 'private';

update public.site_asset
set description = name
where description is null;

alter table public.site_asset
  alter column description set not null,
  add constraint site_asset_description_length check (char_length(description) between 1 and 500),
  add constraint site_asset_visibility_check check (visibility in ('private', 'public'));

comment on column public.site_asset.description is
  'What the file is, for the AI. Examples: shop-front photo, signed contract, or notes gathered about the business.';

comment on column public.site_asset.visibility is
  'private is for the client and the operator. public can be shown on the website at /assets/name.';
