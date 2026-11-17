'use client';

import {designAtomOptions, type DesignOptionDefinition} from '@so/component';
import type {DesignAtomField, DesignAtomPreset, DesignStyle} from '@so/model';
import DesignChoiceTags from '@/components/admin/DesignChoiceTags';
import DesignColourControl from '@/components/admin/DesignColourControl';
import {AdminIconButton} from '@/components/admin/AdminEditorIcons';
import {definitionFromField, FIELD_GROUPS, FIELD_KINDS, replaceField, shownChoices} from '@/components/admin/designAtomFieldForm';

export default function DesignAtomFieldRow({
  preset,
  field,
  onChange,
  onRemove,
}: {
  preset: DesignAtomPreset;
  field: DesignAtomField;
  onChange: (preset: DesignAtomPreset) => void;
  onRemove: () => void;
}) {
  const options = designAtomOptions(preset.base);
  const option = definitionFromField(field, options);
  return (
    <div className="design-field-row">
      <label>
        Prop
        <input value={field.key} readOnly />
      </label>
      <label>
        Label
        <input
          value={field.label}
          maxLength={40}
          onChange={(event) => onChange(replaceField(preset, {...field, label: event.target.value}, options))}
        />
      </label>
      <label>
        Group
        <select value={field.group} onChange={(event) => onChange(replaceField(preset, {...field, group: event.target.value === 'setting' ? 'setting' : 'content'}, options))}>
          {FIELD_GROUPS.map((group) => (
            <option key={group.group} value={group.group}>
              {group.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Kind
        <select value={field.kind} onChange={(event) => onChange(replaceField(preset, fieldWithKind(field, event.target.value), options))}>
          {FIELD_KINDS.map((kind) => (
            <option key={kind.kind} value={kind.kind}>
              {kind.label}
            </option>
          ))}
        </select>
      </label>
      {field.kind === 'choice' ? (
        <DesignChoiceTags
          values={shownChoices(field, options)}
          onChange={(values) => onChange(replaceField(preset, fieldWithChoices(field, values), options))}
        />
      ) : null}
      {field.group === 'setting' ? (
        <SettingControl option={option} value={preset.style[field.key]} onChange={(value) => onChange({...preset, style: {...preset.style, [field.key]: value}})} />
      ) : (
        <span className="admin-muted">Filled in on the template</span>
      )}
      <AdminIconButton label={`Remove ${field.label}`} icon="bin" onClick={onRemove} />
    </div>
  );
}

function fieldWithChoices(field: DesignAtomField, values: readonly string[]): DesignAtomField {
  if (values.length === 0) {
    return {key: field.key, label: field.label, group: field.group, kind: 'choice'};
  }
  return {...field, kind: 'choice', values: [...values]};
}

function fieldWithKind(field: DesignAtomField, value: string): DesignAtomField {
  const kind = FIELD_KINDS.find((item) => item.kind === value)?.kind ?? 'text';
  if (kind === 'choice') {
    return field.kind === 'choice' ? field : {key: field.key, label: field.label, group: field.group, kind};
  }
  return {key: field.key, label: field.label, group: field.group, kind};
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
