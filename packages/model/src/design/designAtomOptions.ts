export const DESIGN_ATOMS = ['button', 'iconButton', 'imageButton', 'link', 'switch', 'text'] as const;

export type DesignAtom = (typeof DESIGN_ATOMS)[number];

export const DESIGN_STYLE_KEYS = ['background', 'color', 'radiusPx', 'borderWidthPx', 'borderColor'] as const;

export type DesignStyleKey = (typeof DESIGN_STYLE_KEYS)[number];

export const DESIGN_CONTENT_KEYS = ['label', 'href', 'icon', 'src', 'alt', 'text', 'role', 'checked'] as const;

export type DesignContentKey = (typeof DESIGN_CONTENT_KEYS)[number];

export const DESIGN_FLEX_KEYS = ['direction', 'gapPx', 'align', 'valign', 'wrap'] as const;

export type DesignFlexKey = (typeof DESIGN_FLEX_KEYS)[number];

export interface DesignAtomOption {
  readonly key: DesignStyleKey | DesignContentKey;
  readonly label: string;
  readonly group: 'style' | 'content';
}

const colour = (key: DesignStyleKey, label: string): DesignAtomOption => ({key, label, group: 'style'});
const content = (key: DesignContentKey, label: string): DesignAtomOption => ({key, label, group: 'content'});

const buttonStyle: readonly DesignAtomOption[] = [
  colour('background', 'Background'),
  colour('color', 'Text colour'),
  colour('radiusPx', 'Corner radius'),
  colour('borderWidthPx', 'Border width'),
  colour('borderColor', 'Border colour'),
];

export const DESIGN_ATOM_OPTIONS: Record<DesignAtom, readonly DesignAtomOption[]> = {
  button: [content('label', 'Label'), content('href', 'Link'), ...buttonStyle],
  iconButton: [content('label', 'Label'), content('href', 'Link'), content('icon', 'Icon'), ...buttonStyle],
  imageButton: [
    content('label', 'Label'),
    content('href', 'Link'),
    content('src', 'Image'),
    content('alt', 'Alt text'),
    colour('radiusPx', 'Corner radius'),
    colour('borderWidthPx', 'Border width'),
    colour('borderColor', 'Border colour'),
  ],
  link: [content('label', 'Label'), content('href', 'Link'), colour('color', 'Text colour')],
  switch: [content('label', 'Label'), content('checked', 'Checked'), colour('color', 'Colour')],
  text: [content('text', 'Text'), content('role', 'Role'), colour('color', 'Text colour')],
};

export const DESIGN_FLEX_OPTIONS: readonly {readonly key: DesignFlexKey; readonly label: string}[] = [
  {key: 'direction', label: 'Direction'},
  {key: 'gapPx', label: 'Gap'},
  {key: 'align', label: 'Alignment'},
  {key: 'valign', label: 'Vertical alignment'},
  {key: 'wrap', label: 'Wrap'},
];

export function designAtomOptions(atom: DesignAtom): readonly DesignAtomOption[] {
  return DESIGN_ATOM_OPTIONS[atom];
}

export function isDesignStyleKey(atom: DesignAtom, key: string): key is DesignStyleKey {
  return designAtomOptions(atom).some((option) => option.group === 'style' && option.key === key);
}

export function isDesignContentKey(atom: DesignAtom, key: string): key is DesignContentKey {
  return designAtomOptions(atom).some((option) => option.group === 'content' && option.key === key);
}
