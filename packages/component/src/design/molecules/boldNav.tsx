import {BOLD_NAIL_ATOMS, boldNavDocument, type DesignMolecule} from '@so/model';
import {DesignNodes} from '../DesignNodes';
import {designContainerStyle, designFlexStyle} from '../designLayoutStyle';

export function BoldNav() {
  return (
    <div style={{...designContainerStyle(boldNavDocument.container), ...designFlexStyle(boldNavDocument.layout)}}>
      <DesignNodes nodes={boldNavDocument.children} molecules={[]} atoms={BOLD_NAIL_ATOMS} />
    </div>
  );
}

export const boldNav = {
  id: 'bold-nav',
  name: 'Bold nav',
  document: boldNavDocument,
  Component: BoldNav,
} satisfies DesignMolecule & {Component: typeof BoldNav};
