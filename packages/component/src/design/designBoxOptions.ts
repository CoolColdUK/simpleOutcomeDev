import type {DesignOptionDefinition} from './designOption';

export const DESIGN_BOX_OPTIONS: readonly DesignOptionDefinition[] = [
  {key: 'padding', label: 'Padding', group: 'setting', kind: 'number', min: 0, max: 64, initial: 12},
  {key: 'margin', label: 'Margin', group: 'setting', kind: 'number', min: 0, max: 64, initial: 0},
  {key: 'gap', label: 'Gap', group: 'setting', kind: 'number', min: 0, max: 64, initial: 8},
  {key: 'background', label: 'Background', group: 'setting', kind: 'colour', initial: 'siteCard'},
  {key: 'color', label: 'Text colour', group: 'setting', kind: 'colour', initial: 'siteForeground'},
  {key: 'borderRadius', label: 'Corner radius', group: 'setting', kind: 'number', min: 0, max: 32, initial: 16},
  {key: 'borderWidth', label: 'Border width', group: 'setting', kind: 'number', min: 0, max: 8, initial: 1},
  {key: 'borderColor', label: 'Border colour', group: 'setting', kind: 'colour', initial: 'siteAccent'},
  {key: 'fontSize', label: 'Font size', group: 'setting', kind: 'number', min: 12, max: 72, initial: 16},
  {key: 'textAlign', label: 'Text align', group: 'setting', kind: 'choice', values: ['start', 'center', 'end'], initial: 'start'},
];

export function withBoxOptions(options: readonly DesignOptionDefinition[]): DesignOptionDefinition[] {
  const keys = new Set(options.map((option) => option.key));
  return [...options, ...DESIGN_BOX_OPTIONS.filter((option) => !keys.has(option.key))];
}
