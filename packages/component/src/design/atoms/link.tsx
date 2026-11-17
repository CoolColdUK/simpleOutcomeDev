import {linkRecord} from '../designAtomRecords';
import type {DesignAtomPart} from '../designOption';
import {designAtomCss, designSlotText, type DesignAtomProps} from '../designAtomProps';

export function LinkAtom({node, values}: DesignAtomProps) {
  return (
    <a className="design-atom-link" href={designSlotText(node, values, 'href', '#design')} style={designAtomCss(node.style)}>
      {designSlotText(node, values, 'label', 'Link')}
    </a>
  );
}

export const link = {...linkRecord, Component: LinkAtom} satisfies DesignAtomPart;
