import {textRecord} from '../designAtomRecords';
import type {DesignAtomPart} from '../designOption';
import {designAtomCss, designSlotText, type DesignAtomProps} from '../designAtomProps';

export function TextAtom({node, values}: DesignAtomProps) {
  const copy = designSlotText(node, values, 'text', 'Text');
  const style = designAtomCss(node.style);
  if (node.slots.includes('role') && values?.['role'] !== 'body') {
    return (
      <h2 className="design-atom-heading" style={style}>
        {copy}
      </h2>
    );
  }
  return (
    <p className="design-atom-text" style={style}>
      {copy}
    </p>
  );
}

export const text = {...textRecord, Component: TextAtom} satisfies DesignAtomPart;
