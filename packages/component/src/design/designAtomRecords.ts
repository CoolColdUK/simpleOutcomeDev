import {withBoxOptions} from './designBoxOptions';

export const buttonRecord = {
  atom: 'button' as const,
  label: 'Button',
  options: withBoxOptions([
    {key: 'label', label: 'Label', group: 'content', kind: 'text'},
    {key: 'href', label: 'Link', group: 'content', kind: 'text'},
    {key: 'background', label: 'Background', group: 'setting', kind: 'colour', initial: 'siteAccent'},
    {key: 'color', label: 'Text colour', group: 'setting', kind: 'colour', initial: 'siteButtonForeground'},
    {key: 'borderRadius', label: 'Corner radius', group: 'setting', kind: 'number', min: 0, max: 32, initial: 16},
    {key: 'borderWidth', label: 'Border width', group: 'setting', kind: 'number', min: 0, max: 8, initial: 0},
    {key: 'borderColor', label: 'Border colour', group: 'setting', kind: 'colour', initial: 'siteAccent'},
  ]),
};

export const checkboxRecord = {
  atom: 'checkbox' as const,
  label: 'Checkbox',
  options: withBoxOptions([
    {key: 'label', label: 'Label', group: 'content', kind: 'text'},
    {key: 'checked', label: 'Checked', group: 'content', kind: 'boolean'},
    {key: 'color', label: 'Colour', group: 'setting', kind: 'colour', initial: 'siteForeground'},
  ]),
};

export const iconButtonRecord = {
  atom: 'iconButton' as const,
  label: 'Icon button',
  options: withBoxOptions([
    {key: 'label', label: 'Label', group: 'content', kind: 'text'},
    {key: 'href', label: 'Link', group: 'content', kind: 'text'},
    {key: 'icon', label: 'Icon', group: 'content', kind: 'choice', values: ['menu', 'close', 'phone', 'arrow']},
    {key: 'background', label: 'Background', group: 'setting', kind: 'colour', initial: 'siteAccent'},
    {key: 'color', label: 'Text colour', group: 'setting', kind: 'colour', initial: 'siteButtonForeground'},
    {key: 'borderRadius', label: 'Corner radius', group: 'setting', kind: 'number', min: 0, max: 32, initial: 16},
    {key: 'borderWidth', label: 'Border width', group: 'setting', kind: 'number', min: 0, max: 8, initial: 0},
    {key: 'borderColor', label: 'Border colour', group: 'setting', kind: 'colour', initial: 'siteAccent'},
  ]),
};

export const imageButtonRecord = {
  atom: 'imageButton' as const,
  label: 'Image button',
  options: withBoxOptions([
    {key: 'label', label: 'Label', group: 'content', kind: 'text'},
    {key: 'href', label: 'Link', group: 'content', kind: 'text'},
    {key: 'src', label: 'Image', group: 'content', kind: 'text'},
    {key: 'alt', label: 'Alt text', group: 'content', kind: 'text'},
    {key: 'borderRadius', label: 'Corner radius', group: 'setting', kind: 'number', min: 0, max: 32, initial: 16},
    {key: 'borderWidth', label: 'Border width', group: 'setting', kind: 'number', min: 0, max: 8, initial: 0},
    {key: 'borderColor', label: 'Border colour', group: 'setting', kind: 'colour', initial: 'siteAccent'},
  ]),
};

export const linkRecord = {
  atom: 'link' as const,
  label: 'Link',
  options: withBoxOptions([
    {key: 'label', label: 'Label', group: 'content', kind: 'text'},
    {key: 'href', label: 'Link', group: 'content', kind: 'text'},
    {key: 'color', label: 'Text colour', group: 'setting', kind: 'colour', initial: 'siteAccent'},
  ]),
};

export const switchRecord = {
  atom: 'switch' as const,
  label: 'Switch',
  options: withBoxOptions([
    {key: 'label', label: 'Label', group: 'content', kind: 'text'},
    {key: 'checked', label: 'On', group: 'content', kind: 'boolean'},
    {key: 'color', label: 'Colour', group: 'setting', kind: 'colour', initial: 'siteAccent'},
  ]),
};

export const textRecord = {
  atom: 'text' as const,
  label: 'Text',
  options: withBoxOptions([
    {key: 'text', label: 'Text', group: 'content', kind: 'text'},
    {key: 'role', label: 'Role', group: 'content', kind: 'choice', values: ['heading', 'body']},
    {key: 'color', label: 'Text colour', group: 'setting', kind: 'colour', initial: 'siteForeground'},
  ]),
};

export const DESIGN_ATOM_RECORDS = [buttonRecord, checkboxRecord, iconButtonRecord, imageButtonRecord, linkRecord, switchRecord, textRecord] as const;

export const DESIGN_ATOMS = [buttonRecord.atom, checkboxRecord.atom, iconButtonRecord.atom, imageButtonRecord.atom, linkRecord.atom, switchRecord.atom, textRecord.atom] as const;

export type DesignAtom = (typeof DESIGN_ATOMS)[number];
