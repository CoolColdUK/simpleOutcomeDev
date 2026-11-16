-- Atom presets, and the Bold Nail Bar template broken into molecules and sections.
-- Colours point at the theme (siteAccent, siteForeground, hero) instead of fixed hex values.

create table public.design_atom (
  id text primary key,
  name text not null,
  base text not null,
  fields jsonb not null,
  style jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint design_atom_id_format check (id ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'),
  constraint design_atom_name_length check (char_length(name) between 1 and 80),
  constraint design_atom_base_format check (base ~ '^[a-z][A-Za-z0-9]{0,40}$'),
  constraint design_atom_fields_array check (jsonb_typeof(fields) = 'array'),
  constraint design_atom_style_object check (jsonb_typeof(style) = 'object')
);

comment on table public.design_atom is
  'A preset of a built-in atom. fields are the options an admin can edit. style stores the preset settings.';

create trigger design_atom_set_updated_at
  before update on public.design_atom
  for each row execute function extensions.moddatetime('updated_at');

alter table public.design_atom enable row level security;
revoke all on table public.design_atom from public, anon, authenticated;
grant all on table public.design_atom to service_role;
grant select on table public.design_atom to anon, authenticated;
create policy design_atom_select_public
  on public.design_atom
  for select
  to anon, authenticated
  using (true);

insert into public.design_atom (id, name, base, fields, style) values ('heading', 'Heading', 'text', $json$[{"key":"text","label":"Text","group":"content","kind":"text"},{"key":"role","label":"Role","group":"content","kind":"choice"},{"key":"color","label":"Text colour","group":"setting","kind":"colour"},{"key":"fontSizePx","label":"Font size","group":"setting","kind":"number"},{"key":"align","label":"Text align","group":"setting","kind":"choice"}]$json$::jsonb, $json${"color":"siteForeground","fontSizePx":32,"align":"start"}$json$::jsonb);
insert into public.design_atom (id, name, base, fields, style) values ('body-copy', 'Body copy', 'text', $json$[{"key":"text","label":"Text","group":"content","kind":"text"},{"key":"color","label":"Text colour","group":"setting","kind":"colour"},{"key":"fontSizePx","label":"Font size","group":"setting","kind":"number"},{"key":"align","label":"Text align","group":"setting","kind":"choice"}]$json$::jsonb, $json${"color":"siteForeground","fontSizePx":16,"align":"start"}$json$::jsonb);
insert into public.design_atom (id, name, base, fields, style) values ('nav-link', 'Nav link', 'link', $json$[{"key":"label","label":"Label","group":"content","kind":"text"},{"key":"href","label":"Link","group":"content","kind":"text"},{"key":"color","label":"Text colour","group":"setting","kind":"colour"}]$json$::jsonb, $json${"color":"siteForeground"}$json$::jsonb);
insert into public.design_atom (id, name, base, fields, style) values ('accent-button', 'Accent button', 'button', $json$[{"key":"label","label":"Label","group":"content","kind":"text"},{"key":"href","label":"Link","group":"content","kind":"text"},{"key":"background","label":"Background","group":"setting","kind":"colour"},{"key":"color","label":"Text colour","group":"setting","kind":"colour"},{"key":"radiusPx","label":"Corner radius","group":"setting","kind":"number"},{"key":"borderWidthPx","label":"Border width","group":"setting","kind":"number"}]$json$::jsonb, $json${"background":"siteAccent","color":"siteButtonForeground","radiusPx":16,"borderWidthPx":0}$json$::jsonb);
insert into public.design_atom (id, name, base, fields, style) values ('service-name', 'Service name', 'text', $json$[{"key":"text","label":"Text","group":"content","kind":"text"},{"key":"color","label":"Text colour","group":"setting","kind":"colour"},{"key":"fontSizePx","label":"Font size","group":"setting","kind":"number"}]$json$::jsonb, $json${"color":"siteForeground","fontSizePx":18}$json$::jsonb);
insert into public.design_atom (id, name, base, fields, style) values ('service-price', 'Service price', 'text', $json$[{"key":"text","label":"Text","group":"content","kind":"text"},{"key":"color","label":"Text colour","group":"setting","kind":"colour"},{"key":"fontSizePx","label":"Font size","group":"setting","kind":"number"}]$json$::jsonb, $json${"color":"siteAccent","fontSizePx":20}$json$::jsonb);

insert into public.design_molecule (id, name, document) values ('bold-nav', 'Bold nav', $json${"pattern":"tree","layout":{"direction":"row","gapPx":16,"align":"center","valign":"center","wrap":"wrap"},"container":{"paddingPx":16,"background":"siteBackground"},"children":[{"id":"name","kind":"atom","atom":"text","presetId":"heading","style":{"fontSizePx":22},"slots":[]},{"id":"prices","kind":"atom","atom":"link","presetId":"nav-link","style":{},"slots":[]},{"id":"gallery","kind":"atom","atom":"link","presetId":"nav-link","style":{},"slots":[]},{"id":"book","kind":"atom","atom":"button","presetId":"accent-button","style":{},"slots":[]}]}$json$::jsonb);
insert into public.design_molecule (id, name, document) values ('bold-hero', 'Bold hero', $json${"pattern":"tree","layout":{"direction":"column","gapPx":12,"align":"center","valign":"center"},"container":{"paddingPx":32,"background":"hero","radiusPx":16},"children":[{"id":"title","kind":"atom","atom":"text","presetId":"heading","style":{"color":"siteButtonForeground","align":"center","fontSizePx":40},"slots":[]},{"id":"body","kind":"atom","atom":"text","presetId":"body-copy","style":{"color":"siteButtonForeground","align":"center","fontSizePx":18},"slots":[]},{"id":"cta","kind":"atom","atom":"button","presetId":"accent-button","style":{},"slots":[]}]}$json$::jsonb);
insert into public.design_molecule (id, name, document) values ('service-card', 'Service card', $json${"pattern":"tree","layout":{"direction":"column","gapPx":8,"align":"stretch"},"container":{"widthPx":220,"paddingPx":16,"background":"siteCard","radiusPx":16,"borderWidthPx":1,"borderColor":"siteAccent"},"children":[{"id":"name","kind":"atom","atom":"text","presetId":"service-name","style":{},"slots":[]},{"id":"detail","kind":"atom","atom":"text","presetId":"body-copy","style":{},"slots":[]},{"id":"price","kind":"atom","atom":"text","presetId":"service-price","style":{},"slots":[]}]}$json$::jsonb);
insert into public.design_molecule (id, name, document) values ('bold-service-row', 'Bold service row', $json${"pattern":"tree","layout":{"direction":"row","gapPx":12,"align":"stretch","wrap":"wrap"},"children":[{"id":"gel","kind":"molecule","moleculeId":"service-card"},{"id":"biab","kind":"molecule","moleculeId":"service-card"},{"id":"lashes","kind":"molecule","moleculeId":"service-card"},{"id":"brows","kind":"molecule","moleculeId":"service-card"}]}$json$::jsonb);
insert into public.design_molecule (id, name, document) values ('bold-services', 'Bold services', $json${"pattern":"tree","layout":{"direction":"column","gapPx":16,"align":"stretch"},"container":{"paddingPx":24},"children":[{"id":"title","kind":"atom","atom":"text","presetId":"heading","style":{"align":"center","fontSizePx":28},"slots":[]},{"id":"cards","kind":"molecule","moleculeId":"bold-service-row"}]}$json$::jsonb);
insert into public.design_molecule (id, name, document) values ('gallery-tile', 'Gallery tile', $json${"pattern":"tree","layout":{"direction":"column","align":"center","valign":"center"},"container":{"widthPx":220,"minHeightPx":140,"paddingPx":12,"background":"siteCard","radiusPx":16},"children":[{"id":"label","kind":"atom","atom":"text","presetId":"body-copy","style":{"align":"center"},"slots":[]}]}$json$::jsonb);
insert into public.design_molecule (id, name, document) values ('bold-gallery', 'Bold gallery', $json${"pattern":"tree","layout":{"direction":"row","gapPx":12,"wrap":"wrap"},"container":{"paddingPx":24},"children":[{"id":"shot1","kind":"molecule","moleculeId":"gallery-tile"},{"id":"shot2","kind":"molecule","moleculeId":"gallery-tile"},{"id":"shot3","kind":"molecule","moleculeId":"gallery-tile"},{"id":"shot4","kind":"molecule","moleculeId":"gallery-tile"}]}$json$::jsonb);
insert into public.design_molecule (id, name, document) values ('footer-note', 'Footer note', $json${"pattern":"tree","layout":{"direction":"column","align":"center"},"container":{"paddingPx":24,"background":"siteBackground"},"children":[{"id":"line","kind":"atom","atom":"text","presetId":"body-copy","style":{"align":"center","fontSizePx":14},"slots":[]}]}$json$::jsonb);

insert into public.design_organism (id, name, category, document) values ('bold-nail-header', 'Bold nail header', 'header', $json${"children":[{"id":"section","kind":"molecule","moleculeId":"bold-nav"}]}$json$::jsonb);
insert into public.design_organism (id, name, category, document) values ('bold-nail-hero', 'Bold nail hero', 'page', $json${"children":[{"id":"section","kind":"molecule","moleculeId":"bold-hero"}]}$json$::jsonb);
insert into public.design_organism (id, name, category, document) values ('bold-nail-services', 'Bold nail services', 'page', $json${"children":[{"id":"section","kind":"molecule","moleculeId":"bold-services"}]}$json$::jsonb);
insert into public.design_organism (id, name, category, document) values ('bold-nail-gallery', 'Bold nail gallery', 'page', $json${"children":[{"id":"section","kind":"molecule","moleculeId":"bold-gallery"}]}$json$::jsonb);
insert into public.design_organism (id, name, category, document) values ('bold-nail-footer', 'Bold nail footer', 'footer', $json${"children":[{"id":"section","kind":"molecule","moleculeId":"footer-note"}]}$json$::jsonb);

update public.design_molecule
set document = $json${"pattern":"tree","layout":{"direction":"row","gapPx":12,"align":"center","valign":"center","wrap":"wrap"},"children":[{"id":"book","kind":"atom","atom":"button","style":{"background":"siteAccent","color":"siteButtonForeground","radiusPx":16},"slots":["label","href"]},{"id":"call","kind":"atom","atom":"iconButton","style":{"background":"siteAccent","color":"siteButtonForeground","radiusPx":16},"slots":["label","href","icon"]},{"id":"photo","kind":"atom","atom":"imageButton","style":{"radiusPx":16,"background":"siteCard"},"slots":["label","href","src","alt"]}]}$json$::jsonb
where id = 'action-row';

update public.design_organism
set document = $json${"children":[{"id":"line","kind":"atom","atom":"text","style":{},"slots":["text"]},{"id":"home","kind":"atom","atom":"link","style":{"color":"siteAccent"},"slots":["label","href"]}]}$json$::jsonb
where id = 'footer-bar';

update public.site_template
set items = $json$[{"id":"nav","moleculeId":"bold-nav","values":{"name":{"text":"CANDY CLAW","role":"heading"},"prices":{"label":"Prices","href":"#prices"},"gallery":{"label":"Gallery","href":"#gallery"},"book":{"label":"Book your set","href":"https://www.fresha.com/"}}},{"id":"hero","moleculeId":"bold-hero","values":{"title":{"text":"Bright nails. Big energy.","role":"heading"},"body":{"text":"Chrome, jelly, 3D art and full sets. Walk-ins welcome."},"cta":{"label":"Book your set","href":"https://www.fresha.com/"}}},{"id":"services","moleculeId":"bold-services","values":{"title":{"text":"Sets","role":"heading"},"cards.gel.name":{"text":"Gel manicure"},"cards.gel.detail":{"text":"45 min"},"cards.gel.price":{"text":"£28"},"cards.biab.name":{"text":"BIAB overlay"},"cards.biab.detail":{"text":"60 min"},"cards.biab.price":{"text":"£35"},"cards.lashes.name":{"text":"Lash lift & tint"},"cards.lashes.detail":{"text":"50 min"},"cards.lashes.price":{"text":"£40"},"cards.brows.name":{"text":"Brow shape & tint"},"cards.brows.detail":{"text":"30 min"},"cards.brows.price":{"text":"£20"}}},{"id":"gallery","moleculeId":"bold-gallery","values":{"shot1.label":{"text":"Chrome"},"shot2.label":{"text":"Jelly"},"shot3.label":{"text":"3D art"},"shot4.label":{"text":"Full set"}}},{"id":"footer","moleculeId":"footer-note","values":{"line":{"text":"CANDY CLAW · Sample design by Simple Outcome · Fictional business and placeholder content"}}}]$json$::jsonb
where id = 'bold-nail-bar';

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.design_atom;
  end if;
end $$;
