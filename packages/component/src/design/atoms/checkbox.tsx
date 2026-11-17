import {checkboxRecord} from '../designAtomRecords';
import type {DesignAtomPart} from '../designOption';
import {designAtomCss, designSlotText, type DesignAtomProps} from '../designAtomProps';

export function CheckboxAtom({node, values}: DesignAtomProps) {
  return (
    <label className="design-check" style={designAtomCss(node.style)}>
      <input type="checkbox" readOnly checked={values?.['checked'] === true} />
      {designSlotText(node, values, 'label', 'Checkbox')}
    </label>
  );
}

export const checkbox = {...checkboxRecord, Component: CheckboxAtom} satisfies DesignAtomPart;
