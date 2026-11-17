-- Atom box settings now use the component prop name.
-- paddingPx becomes padding, radiusPx becomes borderRadius, align becomes textAlign.
-- Molecule and section layout keys are left unchanged.

create function public.design_box_prop_key(key text)
returns text
language sql
immutable
as $$
  select case key
    when 'paddingPx' then 'padding'
    when 'marginPx' then 'margin'
    when 'gapPx' then 'gap'
    when 'radiusPx' then 'borderRadius'
    when 'borderWidthPx' then 'borderWidth'
    when 'fontSizePx' then 'fontSize'
    when 'align' then 'textAlign'
    else key
  end;
$$;

create function public.design_rename_atom_box_keys(node jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  child jsonb;
  children jsonb := '[]'::jsonb;
  style jsonb;
begin
  if jsonb_typeof(node) <> 'object' then
    return node;
  end if;
  if node->>'kind' = 'atom' and jsonb_typeof(node->'style') = 'object' then
    select coalesce(jsonb_object_agg(public.design_box_prop_key(key), value), '{}'::jsonb)
      into style
    from jsonb_each(node->'style');
    node := jsonb_set(node, '{style}', style);
  end if;
  if jsonb_typeof(node->'children') = 'array' then
    for child in select value from jsonb_array_elements(node->'children') loop
      children := children || jsonb_build_array(public.design_rename_atom_box_keys(child));
    end loop;
    node := jsonb_set(node, '{children}', children);
  end if;
  return node;
end;
$$;

update public.design_atom
set
  style = (
    select coalesce(jsonb_object_agg(public.design_box_prop_key(key), value), '{}'::jsonb)
    from jsonb_each(style)
  ),
  fields = (
    select coalesce(
      jsonb_agg(jsonb_set(field, '{key}', to_jsonb(public.design_box_prop_key(field->>'key')))),
      '[]'::jsonb
    )
    from jsonb_array_elements(fields) field
  );

update public.design_molecule
set document = public.design_rename_atom_box_keys(document);

update public.design_organism
set document = public.design_rename_atom_box_keys(document);

drop function public.design_rename_atom_box_keys(jsonb);
drop function public.design_box_prop_key(text);
