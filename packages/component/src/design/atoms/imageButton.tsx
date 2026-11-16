import type {DesignAtomPart} from '../designOption';
import {designAtomCss, designSlotText, type DesignAtomProps} from '../designAtomProps';

export function ImageButtonAtom({node, values}: DesignAtomProps) {
  return (
    <a className="design-image-button" href={designSlotText(node, values, 'href', '#design')} style={designAtomCss(node.style)}>
      <span className="design-image-placeholder">{designSlotText(node, values, 'alt', 'Image')}</span>
      <span>{designSlotText(node, values, 'label', 'Image button')}</span>
    </a>
  );
}

export const imageButton = {
  atom: 'imageButton' as const,
  label: 'Image button',
  options: [
    {key: 'label', label: 'Label', group: 'content', kind: 'text'},
    {key: 'href', label: 'Link', group: 'content', kind: 'text'},
    {key: 'src', label: 'Image', group: 'content', kind: 'text'},
    {key: 'alt', label: 'Alt text', group: 'content', kind: 'text'},
    {key: 'radiusPx', label: 'Corner radius', group: 'setting', kind: 'number', min: 0, max: 32, initial: 8},
    {key: 'borderWidthPx', label: 'Border width', group: 'setting', kind: 'number', min: 0, max: 8, initial: 1},
    {key: 'borderColor', label: 'Border colour', group: 'setting', kind: 'colour', initial: '#111111'},
  ],
  Component: ImageButtonAtom,
} satisfies DesignAtomPart;
