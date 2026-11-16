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

export const text = {
  atom: 'text' as const,
  label: 'Text',
  options: [
    {key: 'text', label: 'Text', group: 'content', kind: 'text'},
    {key: 'role', label: 'Role', group: 'content', kind: 'choice', values: ['heading', 'body']},
    {key: 'color', label: 'Text colour', group: 'setting', kind: 'colour', initial: '#111111'},
  ],
  Component: TextAtom,
} satisfies DesignAtomPart;
