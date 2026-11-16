import type {DesignAtomPart} from '../designOption';
import {designAtomCss, designSlotText, type DesignAtomProps} from '../designAtomProps';

export function IconButtonAtom({node, values}: DesignAtomProps) {
  const label = designSlotText(node, values, 'label', 'Icon button');
  return (
    <a className="design-icon-button" href={designSlotText(node, values, 'href', '#design')} aria-label={label} style={designAtomCss(node.style)}>
      <span aria-hidden="true">{designSlotText(node, values, 'icon', '☎')}</span>
    </a>
  );
}

export const iconButton = {
  atom: 'iconButton' as const,
  label: 'Icon button',
  options: [
    {key: 'label', label: 'Label', group: 'content', kind: 'text'},
    {key: 'href', label: 'Link', group: 'content', kind: 'text'},
    {key: 'icon', label: 'Icon', group: 'content', kind: 'choice', values: ['menu', 'close', 'phone', 'arrow']},
    {key: 'background', label: 'Background', group: 'setting', kind: 'colour', initial: '#111111'},
    {key: 'color', label: 'Text colour', group: 'setting', kind: 'colour', initial: '#ffffff'},
    {key: 'radiusPx', label: 'Corner radius', group: 'setting', kind: 'number', min: 0, max: 32, initial: 8},
    {key: 'borderWidthPx', label: 'Border width', group: 'setting', kind: 'number', min: 0, max: 8, initial: 1},
    {key: 'borderColor', label: 'Border colour', group: 'setting', kind: 'colour', initial: '#111111'},
  ],
  Component: IconButtonAtom,
} satisfies DesignAtomPart;
