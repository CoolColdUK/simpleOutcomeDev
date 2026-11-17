import {imageButtonRecord} from '../designAtomRecords';
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

export const imageButton = {...imageButtonRecord, Component: ImageButtonAtom} satisfies DesignAtomPart;
