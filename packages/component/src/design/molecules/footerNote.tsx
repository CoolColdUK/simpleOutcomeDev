import {BOLD_NAIL_ATOMS, footerNoteDocument, type DesignMolecule} from '@so/model';
import {DesignNodes} from '../DesignNodes';
import {designContainerStyle, designFlexStyle} from '../designLayoutStyle';

export function FooterNote() {
  return (
    <div style={{...designContainerStyle(footerNoteDocument.container), ...designFlexStyle(footerNoteDocument.layout)}}>
      <DesignNodes nodes={footerNoteDocument.children} molecules={[]} atoms={BOLD_NAIL_ATOMS} />
    </div>
  );
}

export const footerNote = {
  id: 'footer-note',
  name: 'Footer note',
  document: footerNoteDocument,
  Component: FooterNote,
} satisfies DesignMolecule & {Component: typeof FooterNote};
