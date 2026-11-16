import {withBoxOptions} from '../designBoxOptions';
import type {DesignAtomPart} from '../designOption';
import {designAtomCss, designSlotText, type DesignAtomProps} from '../designAtomProps';

export function LinkAtom({node, values}: DesignAtomProps) {
  return (
    <a className="design-atom-link" href={designSlotText(node, values, 'href', '#design')} style={designAtomCss(node.style)}>
      {designSlotText(node, values, 'label', 'Link')}
    </a>
  );
}

export const link = {
  atom: 'link' as const,
  label: 'Link',
  options: withBoxOptions([
    {key: 'label', label: 'Label', group: 'content', kind: 'text'},
    {key: 'href', label: 'Link', group: 'content', kind: 'text'},
    {key: 'color', label: 'Text colour', group: 'setting', kind: 'colour', initial: 'siteAccent'},
  ]),
  Component: LinkAtom,
} satisfies DesignAtomPart;
