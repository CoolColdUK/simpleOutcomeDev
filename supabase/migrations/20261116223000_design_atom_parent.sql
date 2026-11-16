-- Saved atoms can extend a component row or another atom.
-- The component name stays in base. Fields on a row can start empty and be added later.

alter table public.design_atom
  add column parent_id text references public.design_atom (id);

alter table public.design_atom
  add constraint design_atom_parent_not_self check (parent_id is null or parent_id <> id);

comment on column public.design_atom.parent_id is
  'Another saved atom with the same base component. Empty means this atom starts from the component named in base.';

insert into public.design_atom (id, name, base, fields, style) values
  ('button', 'Button', 'button', '[]'::jsonb, '{}'::jsonb),
  ('checkbox', 'Checkbox', 'checkbox', '[]'::jsonb, '{}'::jsonb),
  ('switch', 'Switch', 'switch', '[]'::jsonb, '{}'::jsonb),
  ('text', 'Text', 'text', '[]'::jsonb, '{}'::jsonb),
  ('link', 'Link', 'link', '[]'::jsonb, '{}'::jsonb),
  ('icon-button', 'Icon button', 'iconButton', '[]'::jsonb, '{}'::jsonb),
  ('image-button', 'Image button', 'imageButton', '[]'::jsonb, '{}'::jsonb);

update public.design_atom set parent_id = 'text' where id in ('heading', 'body-copy', 'service-name', 'service-price');
update public.design_atom set parent_id = 'link' where id = 'nav-link';
update public.design_atom set parent_id = 'button' where id = 'accent-button';
