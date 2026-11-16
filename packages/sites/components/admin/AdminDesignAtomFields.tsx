'use client';

import {DESIGN_ATOMS, designAtomOptions, type DesignOptionDefinition} from '@so/component';
import type {DesignAtomField, DesignAtomPreset, DesignStyle} from '@so/model';
import AdminDesignOptionMenu from '@/components/admin/AdminDesignOptionMenu';
import DesignColourControl from '@/components/admin/DesignColourControl';
import {designSettingInitial} from '@/components/admin/designSettingInitial';
import {AdminIconButton} from '@/components/admin/AdminEditorIcons';

export function DesignAtomPresetFields({preset, onChange}: {preset: DesignAtomPreset; onChange: (preset: DesignAtomPreset) => void}) {
  const options = designAtomOptions(preset.base);
  const available = options.filter((option) => !preset.fields.some((field) => field.key === option.key));
  return (
    <>
      <label>
        Base
        <select value={preset.base} onChange={(event) => onChange(presetForBase(preset, event.target.value))}>
          {DESIGN_ATOMS.map((atom) => (
            <option key={atom} value={atom}>
              {atom}
            </option>
          ))}
        </select>
      </label>
      <p className="admin-muted">Add a field this atom can draw. Setting fields store the preset. Content fields are filled in on a template. Edit the label to name the field.</p>
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
            <AdminIconButton label={`Remove ${field.label}`} icon="bin" disabled={preset.fields.length < 2} onClick={() => onChange(removeField(preset, field.key))} />
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

function presetForBase(preset: DesignAtomPreset, base: string): DesignAtomPreset {
  const option = designAtomOptions(base).find((item) => item.group === 'content') ?? designAtomOptions(base)[0];
  if (option === undefined) {
    return {...preset, base, fields: preset.fields, style: {}};
  }
  const field: DesignAtomField = {key: option.key, label: option.label, group: option.group, kind: option.kind};
  const style = option.group === 'setting' ? {[option.key]: designSettingInitial(option)} : {};
  return {...preset, base, fields: [field], style};
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
