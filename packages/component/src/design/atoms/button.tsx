import {withBoxOptions} from '../designBoxOptions';
import type {DesignAtomPart} from '../designOption';
import {designAtomCss, designSlotText, type DesignAtomProps} from '../designAtomProps';

export function ButtonAtom({node, values}: DesignAtomProps) {
  return (
    <a className="design-atom-button" href={designSlotText(node, values, 'href', '#design')} style={designAtomCss(node.style)}>
      {designSlotText(node, values, 'label', 'Button')}
    </a>
  );
}

export const button = {
  atom: 'button' as const,
  label: 'Button',
  options: withBoxOptions([
    {key: 'label', label: 'Label', group: 'content', kind: 'text'},
    {key: 'href', label: 'Link', group: 'content', kind: 'text'},
    {key: 'background', label: 'Background', group: 'setting', kind: 'colour', initial: 'siteAccent'},
    {key: 'color', label: 'Text colour', group: 'setting', kind: 'colour', initial: 'siteButtonForeground'},
    {key: 'radiusPx', label: 'Corner radius', group: 'setting', kind: 'number', min: 0, max: 32, initial: 16},
    {key: 'borderWidthPx', label: 'Border width', group: 'setting', kind: 'number', min: 0, max: 8, initial: 0},
    {key: 'borderColor', label: 'Border colour', group: 'setting', kind: 'colour', initial: 'siteAccent'},
  ]),
  Component: ButtonAtom,
} satisfies DesignAtomPart;
