-- Molecules are a flex tree or a combine of atoms and molecules.
-- Content slots are filled on a template item, not stored in the molecule.

alter table public.design_molecule drop constraint design_molecule_document_object;

update public.design_molecule
set document = jsonb_build_object(
  'pattern', 'combine',
  'layout', jsonb_build_object('direction', 'column', 'gapPx', 8),
  'children', jsonb_build_array(
    jsonb_build_object('id', 'trigger', 'kind', 'atom', 'atom', 'button', 'style', '{}'::jsonb, 'slots', jsonb_build_array('label')),
    jsonb_build_object('id', 'panel', 'kind', 'atom', 'atom', 'text', 'style', '{}'::jsonb, 'slots', jsonb_build_array('text'))
  )
)
where document->>'pattern' = 'accordion';

update public.design_molecule
set id = 'grouped', name = 'Grouped'
where id = 'accordion';

update public.design_molecule
set document = $json${"pattern":"tree","layout":{"direction":"row","gapPx":12,"align":"center","valign":"center","wrap":"wrap"},"children":[{"id":"book","kind":"atom","atom":"button","style":{"background":"#111111","color":"#ffffff","radiusPx":8},"slots":["label","href"]},{"id":"call","kind":"atom","atom":"iconButton","style":{"background":"#111111","color":"#ffffff","radiusPx":8},"slots":["label","href","icon"]},{"id":"photo","kind":"atom","atom":"imageButton","style":{"radiusPx":8},"slots":["label","href","src","alt"]}]}$json$::jsonb
where id = 'action-row';

update public.design_molecule
set document = $json${"pattern":"combine","layout":{"direction":"column","gapPx":8},"children":[{"id":"intro","kind":"atom","atom":"text","style":{},"slots":["text"]},{"id":"actions","kind":"molecule","moleculeId":"action-row"}]}$json$::jsonb
where id = 'grouped';

update public.design_organism
set document = $json${"children":[{"id":"name","kind":"atom","atom":"text","style":{},"slots":["text","role"]},{"id":"actions","kind":"molecule","moleculeId":"action-row"}]}$json$::jsonb
where id = 'header-bar';

update public.design_organism
set document = $json${"children":[{"id":"title","kind":"atom","atom":"text","style":{},"slots":["text"]},{"id":"body","kind":"atom","atom":"text","style":{},"slots":["text"]},{"id":"actions","kind":"molecule","moleculeId":"action-row"},{"id":"group","kind":"molecule","moleculeId":"grouped"}]}$json$::jsonb
where id = 'page-band';

update public.design_organism
set document = $json${"children":[{"id":"line","kind":"atom","atom":"text","style":{},"slots":["text"]},{"id":"home","kind":"atom","atom":"link","style":{"color":"#111111"},"slots":["label","href"]}]}$json$::jsonb
where id = 'footer-bar';

alter table public.design_molecule add constraint design_molecule_document_object check (
  jsonb_typeof(document) = 'object'
  and document->>'pattern' in ('tree', 'combine')
);

comment on table public.design_molecule is
  'A molecule built from atoms and other molecules. pattern tree is a flex layout. pattern combine groups pieces. Content slots are filled on a template item.';

alter table public.site_template
  add column items jsonb not null default '[]'::jsonb;

alter table public.site_template
  add constraint site_template_items_array check (jsonb_typeof(items) = 'array');

comment on column public.site_template.items is
  'Molecule items placed on this template. Each item stores the content for the slots that molecule exposes.';
