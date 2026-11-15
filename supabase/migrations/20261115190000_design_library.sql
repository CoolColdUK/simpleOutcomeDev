-- Atomic design library. Atoms stay in code. Molecules, sections (organisms),
-- and Chakra colour schemes live here so the admin can update them live.
-- Existing site_template rows remain the template layer and point at a colour scheme.

create table public.design_colour_scheme (
  id text primary key,
  name text not null,
  tokens jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint design_colour_scheme_id_format check (id ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'),
  constraint design_colour_scheme_name_length check (char_length(name) between 1 and 80),
  constraint design_colour_scheme_tokens_object check (
    jsonb_typeof(tokens) = 'object'
    and jsonb_typeof(tokens->'chakra') = 'object'
  )
);

comment on table public.design_colour_scheme is
  'Chakra theme tokens for a site colour scheme. uppercaseHeadings and heroBackground sit beside the token map.';

create table public.design_molecule (
  id text primary key,
  name text not null,
  document jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint design_molecule_id_format check (id ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'),
  constraint design_molecule_name_length check (char_length(name) between 1 and 80),
  constraint design_molecule_document_object check (
    jsonb_typeof(document) = 'object'
    and document->>'pattern' in ('tree', 'accordion')
  )
);

comment on table public.design_molecule is
  'A molecule built from atoms. pattern tree is a node list. pattern accordion is the accordion molecule.';

create table public.design_organism (
  id text primary key,
  name text not null,
  category text not null,
  document jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint design_organism_id_format check (id ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'),
  constraint design_organism_name_length check (char_length(name) between 1 and 80),
  constraint design_organism_category_check check (category in ('header', 'page', 'footer')),
  constraint design_organism_document_object check (
    jsonb_typeof(document) = 'object'
    and jsonb_typeof(document->'children') = 'array'
  )
);

comment on table public.design_organism is
  'A section (organism) built from atoms and molecules.';

create trigger design_colour_scheme_set_updated_at
  before update on public.design_colour_scheme
  for each row execute function extensions.moddatetime('updated_at');

create trigger design_molecule_set_updated_at
  before update on public.design_molecule
  for each row execute function extensions.moddatetime('updated_at');

create trigger design_organism_set_updated_at
  before update on public.design_organism
  for each row execute function extensions.moddatetime('updated_at');

alter table public.design_colour_scheme enable row level security;
alter table public.design_molecule enable row level security;
alter table public.design_organism enable row level security;

revoke all on table public.design_colour_scheme from public, anon, authenticated;
revoke all on table public.design_molecule from public, anon, authenticated;
revoke all on table public.design_organism from public, anon, authenticated;

grant all on table public.design_colour_scheme to service_role;
grant all on table public.design_molecule to service_role;
grant all on table public.design_organism to service_role;

grant select on table public.design_colour_scheme to anon, authenticated;
grant select on table public.design_molecule to anon, authenticated;
grant select on table public.design_organism to anon, authenticated;

create policy design_colour_scheme_select_public
  on public.design_colour_scheme
  for select
  to anon, authenticated
  using (true);

create policy design_molecule_select_public
  on public.design_molecule
  for select
  to anon, authenticated
  using (true);

create policy design_organism_select_public
  on public.design_organism
  for select
  to anon, authenticated
  using (true);

insert into public.design_colour_scheme (id, name, tokens) values ('clean-studio', 'Clean Studio', $json${"uppercaseHeadings":false,"heroBackground":"linear-gradient(135deg,#f3f3f3,#dcdcdc)","chakra":{"theme":{"tokens":{"colors":{"siteBackground":{"value":"#ffffff"},"siteForeground":{"value":"#1d1d1f"},"siteAccent":{"value":"#111111"},"siteButtonForeground":{"value":"#ffffff"},"siteCard":{"value":"#f7f7f7"}},"fonts":{"siteHeading":{"value":"'Helvetica Neue', Arial, sans-serif"},"siteBody":{"value":"Arial, sans-serif"}},"radii":{"site":{"value":"16px"}}}}}}$json$::jsonb);
insert into public.design_colour_scheme (id, name, tokens) values ('soft-luxury', 'Soft Luxury', $json${"uppercaseHeadings":false,"heroBackground":"linear-gradient(135deg,#f4dcd3,#e9c3b8 60%,#f8ece6)","chakra":{"theme":{"tokens":{"colors":{"siteBackground":{"value":"#fbf6f1"},"siteForeground":{"value":"#4a3b36"},"siteAccent":{"value":"#c9958a"},"siteButtonForeground":{"value":"#ffffff"},"siteCard":{"value":"#ffffff"}},"fonts":{"siteHeading":{"value":"Georgia, 'Times New Roman', serif"},"siteBody":{"value":"Georgia, serif"}},"radii":{"site":{"value":"16px"}}}}}}$json$::jsonb);
insert into public.design_colour_scheme (id, name, tokens) values ('portfolio-first', 'Portfolio First', $json${"uppercaseHeadings":true,"heroBackground":"none","chakra":{"theme":{"tokens":{"colors":{"siteBackground":{"value":"#111111"},"siteForeground":{"value":"#f5f5f5"},"siteAccent":{"value":"#e8c547"},"siteButtonForeground":{"value":"#111111"},"siteCard":{"value":"#1d1d1d"}},"fonts":{"siteHeading":{"value":"'Arial Black', Arial, sans-serif"},"siteBody":{"value":"Arial, sans-serif"}},"radii":{"site":{"value":"16px"}}}}}}$json$::jsonb);
insert into public.design_colour_scheme (id, name, tokens) values ('home-studio', 'Home Studio', $json${"uppercaseHeadings":false,"heroBackground":"linear-gradient(135deg,#dfe3cf,#c7cfb0)","chakra":{"theme":{"tokens":{"colors":{"siteBackground":{"value":"#f6f1e7"},"siteForeground":{"value":"#3d4033"},"siteAccent":{"value":"#6f7d5c"},"siteButtonForeground":{"value":"#ffffff"},"siteCard":{"value":"#fffdf8"}},"fonts":{"siteHeading":{"value":"Georgia, serif"},"siteBody":{"value":"Verdana, sans-serif"}},"radii":{"site":{"value":"16px"}}}}}}$json$::jsonb);
insert into public.design_colour_scheme (id, name, tokens) values ('bold-nail-bar', 'Bold Nail Bar', $json${"uppercaseHeadings":true,"heroBackground":"linear-gradient(135deg,#ff2d8a,#7b2dff)","chakra":{"theme":{"tokens":{"colors":{"siteBackground":{"value":"#fff0f7"},"siteForeground":{"value":"#1b0a2e"},"siteAccent":{"value":"#ff2d8a"},"siteButtonForeground":{"value":"#ffffff"},"siteCard":{"value":"#ffffff"}},"fonts":{"siteHeading":{"value":"'Arial Black', Impact, sans-serif"},"siteBody":{"value":"Arial, sans-serif"}},"radii":{"site":{"value":"16px"}}}}}}$json$::jsonb);
insert into public.design_colour_scheme (id, name, tokens) values ('clinic-professional', 'Clinic Professional', $json${"uppercaseHeadings":false,"heroBackground":"linear-gradient(135deg,#d6e9ec,#b7d6dc)","chakra":{"theme":{"tokens":{"colors":{"siteBackground":{"value":"#f4f8f9"},"siteForeground":{"value":"#16323a"},"siteAccent":{"value":"#2a7d8c"},"siteButtonForeground":{"value":"#ffffff"},"siteCard":{"value":"#ffffff"}},"fonts":{"siteHeading":{"value":"'Helvetica Neue', Arial, sans-serif"},"siteBody":{"value":"Arial, sans-serif"}},"radii":{"site":{"value":"16px"}}}}}}$json$::jsonb);
insert into public.design_colour_scheme (id, name, tokens) values ('hair-beauty-menu', 'Hair Beauty Menu', $json${"uppercaseHeadings":false,"heroBackground":"linear-gradient(135deg,#ead9cf,#d2b6a5)","chakra":{"theme":{"tokens":{"colors":{"siteBackground":{"value":"#ffffff"},"siteForeground":{"value":"#2b2b2b"},"siteAccent":{"value":"#8a5a44"},"siteButtonForeground":{"value":"#ffffff"},"siteCard":{"value":"#faf6f3"}},"fonts":{"siteHeading":{"value":"Georgia, serif"},"siteBody":{"value":"Arial, sans-serif"}},"radii":{"site":{"value":"16px"}}}}}}$json$::jsonb);
insert into public.design_colour_scheme (id, name, tokens) values ('review-led', 'Review Led', $json${"uppercaseHeadings":false,"heroBackground":"linear-gradient(135deg,#ffe2b8,#ffd08a)","chakra":{"theme":{"tokens":{"colors":{"siteBackground":{"value":"#fffaf0"},"siteForeground":{"value":"#2d2a26"},"siteAccent":{"value":"#e08a1e"},"siteButtonForeground":{"value":"#ffffff"},"siteCard":{"value":"#ffffff"}},"fonts":{"siteHeading":{"value":"'Trebuchet MS', sans-serif"},"siteBody":{"value":"'Trebuchet MS', sans-serif"}},"radii":{"site":{"value":"16px"}}}}}}$json$::jsonb);
insert into public.design_colour_scheme (id, name, tokens) values ('courses-treatments', 'Courses Treatments', $json${"uppercaseHeadings":false,"heroBackground":"linear-gradient(135deg,#ddd5fa,#c2b4f3)","chakra":{"theme":{"tokens":{"colors":{"siteBackground":{"value":"#f5f3fb"},"siteForeground":{"value":"#2a2440"},"siteAccent":{"value":"#6b4fd8"},"siteButtonForeground":{"value":"#ffffff"},"siteCard":{"value":"#ffffff"}},"fonts":{"siteHeading":{"value":"'Helvetica Neue', Arial, sans-serif"},"siteBody":{"value":"Arial, sans-serif"}},"radii":{"site":{"value":"16px"}}}}}}$json$::jsonb);
insert into public.design_colour_scheme (id, name, tokens) values ('neighbourhood-salon', 'Neighbourhood Salon', $json${"uppercaseHeadings":false,"heroBackground":"linear-gradient(135deg,#cfe8d9,#a9d3bb)","chakra":{"theme":{"tokens":{"colors":{"siteBackground":{"value":"#ffffff"},"siteForeground":{"value":"#1f2a24"},"siteAccent":{"value":"#1f7a4d"},"siteButtonForeground":{"value":"#ffffff"},"siteCard":{"value":"#f3f8f5"}},"fonts":{"siteHeading":{"value":"Verdana, sans-serif"},"siteBody":{"value":"Verdana, sans-serif"}},"radii":{"site":{"value":"16px"}}}}}}$json$::jsonb);
insert into public.design_molecule (id, name, document) values ('accordion', 'Accordion', $json${"pattern":"accordion","items":[{"id":"downtime","title":"Is there any downtime?","body":"It depends on the treatment. You leave with written aftercare either way."},{"id":"results","title":"How long do results last?","body":"Your consultation covers what to expect before anything is booked."}]}$json$::jsonb);
insert into public.design_molecule (id, name, document) values ('action-row', 'Action row', $json${"pattern":"tree","children":[{"id":"row","kind":"stack","direction":"row","gapPx":12,"children":[{"id":"book","kind":"atom","atom":"button","props":{"label":"Book now","href":"https://www.fresha.com/","background":"#111111","color":"#ffffff"}},{"id":"call","kind":"atom","atom":"iconButton","props":{"label":"Call","href":"https://www.fresha.com/","icon":"phone","background":"#111111","color":"#ffffff"}},{"id":"photo","kind":"atom","atom":"imageButton","props":{"label":"See work","href":"https://www.fresha.com/","src":"https://simpleoutcome.dev/","alt":"Work"}},{"id":"open","kind":"atom","atom":"switch","props":{"label":"Open today","checked":true}}]}]}$json$::jsonb);
insert into public.design_organism (id, name, category, document) values ('header-bar', 'Header bar', 'header', $json${"children":[{"id":"name","kind":"atom","atom":"text","props":{"text":"Business name","role":"heading"}},{"id":"actions","kind":"molecule","moleculeId":"action-row"}]}$json$::jsonb);
insert into public.design_organism (id, name, category, document) values ('page-band', 'Page band', 'page', $json${"children":[{"id":"title","kind":"atom","atom":"text","props":{"text":"Section title","role":"heading"}},{"id":"body","kind":"atom","atom":"text","props":{"text":"Supporting copy for this band.","role":"body"}},{"id":"actions","kind":"molecule","moleculeId":"action-row"},{"id":"questions","kind":"molecule","moleculeId":"accordion"}]}$json$::jsonb);
insert into public.design_organism (id, name, category, document) values ('footer-bar', 'Footer bar', 'footer', $json${"children":[{"id":"line","kind":"atom","atom":"text","props":{"text":"Footer","role":"body"}},{"id":"home","kind":"atom","atom":"link","props":{"label":"Back to top","href":"https://simpleoutcome.dev/","color":"#111111"}}]}$json$::jsonb);

alter table public.site_template
  add column colour_scheme_id text references public.design_colour_scheme (id) on delete restrict;

comment on column public.site_template.colour_scheme_id is
  'Chakra colour scheme for this template. The page document.theme is the copy applied to the public site.';

create index site_template_colour_scheme_id_idx on public.site_template (colour_scheme_id);

update public.site_template
set colour_scheme_id = id
where id in (
  'clean-studio',
  'soft-luxury',
  'portfolio-first',
  'home-studio',
  'bold-nail-bar',
  'clinic-professional',
  'hair-beauty-menu',
  'review-led',
  'courses-treatments',
  'neighbourhood-salon'
);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.design_colour_scheme;
    alter publication supabase_realtime add table public.design_molecule;
    alter publication supabase_realtime add table public.design_organism;
  end if;
end $$;
