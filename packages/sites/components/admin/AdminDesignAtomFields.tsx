'use client';

import {DESIGN_ATOMS, designAtomOptions, type DesignOptionDefinition} from '@so/component';
import {mergedDesignAtom, type DesignAtomField, type DesignAtomPreset, type DesignStyle} from '@so/model';
import AdminDesignOptionMenu from '@/components/admin/AdminDesignOptionMenu';
import DesignColourControl from '@/components/admin/DesignColourControl';
import {designSettingInitial} from '@/components/admin/designSettingInitial';
import {AdminIconButton} from '@/components/admin/AdminEditorIcons';

export function DesignAtomPresetFields({
  preset,
  atoms,
  onChange,
}: {
  preset: DesignAtomPreset;
  atoms: readonly DesignAtomPreset[];
  onChange: (preset: DesignAtomPreset) => void;
}) {
  const options = designAtomOptions(preset.base);
  const available = options.filter((option) => !preset.fields.some((field) => field.key === option.key));
  const parent = atoms.find((atom) => atom.id === preset.parentId);
  const inherited = parent === undefined ? [] : mergedDesignAtom(parent, atoms).fields;
  const source = preset.parentId ?? `component:${preset.base}`;
  return (
    <>
      <label>
        Based on
        <select value={source} onChange={(event) => onChange(presetFromSource(preset, event.target.value, atoms))}>
          <optgroup label="Components">
            {DESIGN_ATOMS.map((atom) => (
              <option key={atom} value={`component:${atom}`}>
                {atom}
              </option>
            ))}
          </optgroup>
          <optgroup label="Atoms">
            {atoms
              .filter((atom) => atom.id !== preset.id)
              .map((atom) => (
                <option key={atom.id} value={atom.id}>
                  {atom.name}
                </option>
              ))}
          </optgroup>
        </select>
      </label>
      <p className="admin-muted">
        The component name is the base atom. Start from that component, or from an atom already saved. Add fields when you need them. Setting fields store on this atom. Content fields are filled in on a template.
      </p>
      {inherited.length === 0 ? null : (
        <p className="admin-muted">Inherited from {parent?.name}: {inherited.map((field) => field.label).join(', ')}</p>
      )}
      <AdminDesignOptionMenu
        label="Add field"
        icon
        options={available.map((option) => ({key: option.key, label: option.label}))}
        onPick={(key) => {
          const option = options.find((item) => item.key === key);
          if (option !== undefined) {
            onChange(addField(preset, option));
          }
        }}
      />
      {preset.fields.map((field) => {
        const option = options.find((item) => item.key === field.key);
        return (
          <div key={field.key} className="design-field-row">
            <label>
              Label
              <input value={field.label} maxLength={40} onChange={(event) => onChange(renameField(preset, field.key, event.target.value))} />
            </label>
            {field.group === 'setting' && option !== undefined ? (
              <SettingControl option={option} value={preset.style[field.key]} onChange={(value) => onChange({...preset, style: {...preset.style, [field.key]: value}})} />
            ) : (
              <span className="admin-muted">Filled in on the template</span>
            )}
            <AdminIconButton label={`Remove ${field.label}`} icon="bin" onClick={() => onChange(removeField(preset, field.key))} />
          </div>
        );
      })}
    </>
  );
}

function SettingControl({
  option,
  value,
  onChange,
}: {
  option: DesignOptionDefinition;
  value: DesignStyle[string] | undefined;
  onChange: (value: DesignStyle[string]) => void;
}) {
  if (option.kind === 'number') {
    return <input type="number" min={option.min ?? 0} max={option.max} value={Number(value ?? option.min ?? 0)} onChange={(event) => onChange(Number(event.target.value))} />;
  }
  if (option.kind === 'boolean') {
    return <input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} />;
  }
  if (option.kind === 'choice') {
    return (
      <select value={String(value ?? '')} onChange={(event) => onChange(event.target.value)}>
        {(option.values ?? []).map((choice) => (
          <option key={choice} value={choice}>
            {choice}
          </option>
        ))}
      </select>
    );
  }
  if (option.kind === 'colour') {
    return <DesignColourControl value={String(value ?? 'siteAccent')} onChange={onChange} />;
  }
  return <input value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />;
}

function presetFromSource(preset: DesignAtomPreset, source: string, atoms: readonly DesignAtomPreset[]): DesignAtomPreset {
  if (source.startsWith('component:')) {
    return keepCompatible({...preset, base: source.slice('component:'.length), parentId: undefined});
  }
  const parent = atoms.find((atom) => atom.id === source);
  if (parent === undefined) {
    return preset;
  }
  return keepCompatible({...preset, base: parent.base, parentId: parent.id});
}

function keepCompatible(preset: DesignAtomPreset): DesignAtomPreset {
  const options = designAtomOptions(preset.base);
  const fields = preset.fields.filter((field) => options.some((option) => option.key === field.key && option.group === field.group && option.kind === field.kind));
  const style: DesignStyle = {};
  fields.forEach((field) => {
    const value = preset.style[field.key];
    if (field.group === 'setting' && value !== undefined) {
      style[field.key] = value;
    }
  });
  const {parentId, ...rest} = preset;
  return parentId === undefined ? {...rest, fields, style} : {...rest, parentId, fields, style};
}

function addField(preset: DesignAtomPreset, option: DesignOptionDefinition): DesignAtomPreset {
  const field: DesignAtomField = {key: option.key, label: option.label, group: option.group, kind: option.kind};
  if (option.group === 'content') {
    return {...preset, fields: [...preset.fields, field]};
  }
  return {...preset, fields: [...preset.fields, field], style: {...preset.style, [option.key]: designSettingInitial(option)}};
}

function renameField(preset: DesignAtomPreset, key: string, label: string): DesignAtomPreset {
  return {...preset, fields: preset.fields.map((field) => (field.key === key ? {...field, label} : field))};
}

function removeField(preset: DesignAtomPreset, key: string): DesignAtomPreset {
  return {...preset, fields: preset.fields.filter((field) => field.key !== key), style: styleWithout(preset.style, key)};
}

function styleWithout(style: DesignStyle, key: string): DesignStyle {
  const next = {...style};
  delete next[key];
  return next;
}
