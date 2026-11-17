import {iconButtonRecord} from '../designAtomRecords';
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

export const iconButton = {...iconButtonRecord, Component: IconButtonAtom} satisfies DesignAtomPart;
