import {switchRecord} from '../designAtomRecords';
import type {DesignAtomPart} from '../designOption';
import {designColourCss} from '../designLayoutStyle';
import {designAtomCss, designSlotText, type DesignAtomProps} from '../designAtomProps';

export function SwitchAtom({node, values}: DesignAtomProps) {
  const colour = designColourCss(node.style['color']);
  const on = values?.['checked'] === true;
  return (
    <span className="design-switch" style={designAtomCss(node.style)}>
      <span className="design-switch-track" data-on={on ? 'true' : 'false'} style={colour === undefined ? undefined : {background: colour}} />
      {designSlotText(node, values, 'label', 'Switch')}
    </span>
  );
}

export const switchAtom = {...switchRecord, Component: SwitchAtom} satisfies DesignAtomPart;
