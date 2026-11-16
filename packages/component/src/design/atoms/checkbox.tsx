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

export const checkbox = {
  atom: 'checkbox' as const,
  label: 'Checkbox',
  options: [
    {key: 'label', label: 'Label', group: 'content', kind: 'text'},
    {key: 'checked', label: 'Checked', group: 'content', kind: 'boolean'},
    {key: 'color', label: 'Colour', group: 'setting', kind: 'colour', initial: '#111111'},
  ],
  Component: CheckboxAtom,
} satisfies DesignAtomPart;
