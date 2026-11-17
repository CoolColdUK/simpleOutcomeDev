import type {DesignOptionDefinition} from '@so/component/server';
import {DesignFieldKind, type DesignAtomField, type DesignAtomPreset, type DesignStyle} from '@so/model';
import {designSettingInitial} from '@/components/admin/designSettingInitial';

export const PROP_KEY = /^[a-zA-Z][A-Za-z0-9]{0,40}$/;

export const FIELD_GROUPS = [
  {group: 'content' as const, label: 'Content'},
  {group: 'setting' as const, label: 'Setting'},
];

export const FIELD_KINDS = [
  {kind: DesignFieldKind.TEXT, label: 'Text'},
  {kind: DesignFieldKind.BOOLEAN, label: 'Boolean'},
  {kind: DesignFieldKind.NUMBER, label: 'Number'},
  {kind: DesignFieldKind.COLOUR, label: 'Colour'},
  {kind: DesignFieldKind.CHOICE, label: 'Dropdown'},
];

export interface FieldDraft {
  readonly key: string;
  readonly label: string;
  readonly group: DesignAtomField['group'];
  readonly kind: DesignAtomField['kind'];
  readonly values: readonly string[];
}

export const EMPTY_FIELD_DRAFT: FieldDraft = {key: '', label: '', group: 'content', kind: DesignFieldKind.TEXT, values: []};

export function addFieldError(preset: DesignAtomPreset, draft: FieldDraft): string | undefined {
  const key = draft.key.trim();
  if (!PROP_KEY.test(key)) {
    return 'Prop must start with a letter and use only letters and numbers';
  }
  if (preset.fields.some((field) => field.key === key)) {
    return 'That prop is already on this atom';
  }
  if (draft.label.trim().length === 0 || draft.label.trim().length > 40) {
    return 'Label is required';
  }
  if (draft.kind === DesignFieldKind.CHOICE && draft.values.length === 0) {
    return 'Add at least one choice';
  }
  return undefined;
}

export function fieldFromDraft(draft: FieldDraft): DesignAtomField {
  const key = draft.key.trim();
  const label = draft.label.trim();
  if (draft.kind === DesignFieldKind.CHOICE) {
    return {key, label, group: draft.group, kind: draft.kind, values: [...draft.values]};
  }
  return {key, label, group: draft.group, kind: draft.kind};
}

export function suggestDraft(option: DesignOptionDefinition): Pick<FieldDraft, 'label' | 'group' | 'kind' | 'values'> {
  return {
    label: option.label,
    group: option.group,
    kind: fieldKind(option.kind),
    values: option.values === undefined ? [] : [...option.values],
  };
}

export function shownChoices(field: DesignAtomField, options: readonly DesignOptionDefinition[]): readonly string[] {
  if (field.kind !== DesignFieldKind.CHOICE) {
    return [];
  }
  if (field.values !== undefined) {
    return field.values;
  }
  const option = options.find((item) => item.key === field.key);
  if (option?.kind === 'choice' && option.values !== undefined) {
    return option.values;
  }
  return [];
}

export function definitionFromField(field: DesignAtomField, options: readonly DesignOptionDefinition[]): DesignOptionDefinition {
  const option = options.find((item) => item.key === field.key && item.kind === field.kind);
  const values = field.values ?? option?.values;
  return {
    key: field.key,
    label: field.label,
    group: field.group,
    kind: field.kind,
    ...(values === undefined ? {} : {values}),
    ...(option?.min === undefined ? {} : {min: option.min}),
    ...(option?.max === undefined ? {} : {max: option.max}),
    ...(option?.initial === undefined ? {} : {initial: option.initial}),
  };
}

export function addField(preset: DesignAtomPreset, field: DesignAtomField, options: readonly DesignOptionDefinition[]): DesignAtomPreset {
  return replaceField({...preset, fields: [...preset.fields, field]}, field, options);
}

export function replaceField(preset: DesignAtomPreset, next: DesignAtomField, options: readonly DesignOptionDefinition[]): DesignAtomPreset {
  return {
    ...preset,
    fields: preset.fields.map((field) => (field.key === next.key ? next : field)),
    style: styleForField(preset.style, next, options),
  };
}

export function removeField(preset: DesignAtomPreset, key: string): DesignAtomPreset {
  return {...preset, fields: preset.fields.filter((field) => field.key !== key), style: styleWithout(preset.style, key)};
}

export function keepCompatible(preset: DesignAtomPreset): DesignAtomPreset {
  const style: DesignStyle = {};
  preset.fields.forEach((field) => {
    const value = preset.style[field.key];
    if (field.group === 'setting' && value !== undefined) {
      style[field.key] = value;
    }
  });
  const {parentId, ...rest} = preset;
  return parentId === undefined ? {...rest, style} : {...rest, parentId, style};
}

function styleForField(style: DesignStyle, field: DesignAtomField, options: readonly DesignOptionDefinition[]): DesignStyle {
  if (field.group !== 'setting') {
    return styleWithout(style, field.key);
  }
  if (field.kind === DesignFieldKind.CHOICE && (field.values === undefined || field.values.length === 0)) {
    return styleWithout(style, field.key);
  }
  const option = definitionFromField(field, options);
  const current = style[field.key];
  if (current !== undefined && valueMatches(option, current)) {
    return style;
  }
  return {...styleWithout(style, field.key), [field.key]: designSettingInitial(option)};
}

function valueMatches(option: DesignOptionDefinition, value: DesignStyle[string]): boolean {
  if (option.kind === 'number') {
    return typeof value === 'number';
  }
  if (option.kind === 'boolean') {
    return typeof value === 'boolean';
  }
  if (option.kind === 'choice') {
    return typeof value === 'string' && (option.values ?? []).some((choice) => choice === value);
  }
  return typeof value === 'string';
}

export function fieldKind(kind: string): DesignFieldKind {
  if (kind === DesignFieldKind.BOOLEAN) {
    return DesignFieldKind.BOOLEAN;
  }
  if (kind === DesignFieldKind.NUMBER) {
    return DesignFieldKind.NUMBER;
  }
  if (kind === DesignFieldKind.COLOUR) {
    return DesignFieldKind.COLOUR;
  }
  if (kind === DesignFieldKind.CHOICE) {
    return DesignFieldKind.CHOICE;
  }
  return DesignFieldKind.TEXT;
}

function styleWithout(style: DesignStyle, key: string): DesignStyle {
  const next = {...style};
  delete next[key];
  return next;
}
