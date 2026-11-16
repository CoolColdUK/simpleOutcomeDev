import type {DesignAtomPart} from '../designOption';
import {designAtomCss, designSlotText, textStyle, type DesignAtomProps} from '../designAtomProps';

export function SwitchAtom({node, values}: DesignAtomProps) {
  const colour = textStyle(node.style['color']);
  const on = values?.['checked'] === true;
  return (
    <span className="design-switch" style={designAtomCss(node.style)}>
      <span className="design-switch-track" data-on={on ? 'true' : 'false'} style={colour === undefined ? undefined : {background: colour}} />
      {designSlotText(node, values, 'label', 'Switch')}
    </span>
  );
}

export const switchAtom = {
  atom: 'switch' as const,
  label: 'Switch',
  options: [
    {key: 'label', label: 'Label', group: 'content', kind: 'text'},
    {key: 'checked', label: 'On', group: 'content', kind: 'boolean'},
    {key: 'color', label: 'Colour', group: 'setting', kind: 'colour', initial: '#111111'},
  ],
  Component: SwitchAtom,
} satisfies DesignAtomPart;
