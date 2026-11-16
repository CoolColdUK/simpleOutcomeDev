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
  options: [
    {key: 'label', label: 'Label', group: 'content', kind: 'text'},
    {key: 'href', label: 'Link', group: 'content', kind: 'text'},
    {key: 'background', label: 'Background', group: 'setting', kind: 'colour', initial: '#111111'},
    {key: 'color', label: 'Text colour', group: 'setting', kind: 'colour', initial: '#ffffff'},
    {key: 'radiusPx', label: 'Corner radius', group: 'setting', kind: 'number', min: 0, max: 32, initial: 8},
    {key: 'borderWidthPx', label: 'Border width', group: 'setting', kind: 'number', min: 0, max: 8, initial: 1},
    {key: 'borderColor', label: 'Border colour', group: 'setting', kind: 'colour', initial: '#111111'},
  ],
  Component: ButtonAtom,
} satisfies DesignAtomPart;
