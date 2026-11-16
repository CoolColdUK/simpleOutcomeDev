import {BOLD_NAIL_ATOMS, boldServiceRowDocument, type DesignMolecule} from '@so/model';
import {DesignNodes} from '../DesignNodes';
import {designContainerStyle, designFlexStyle} from '../designLayoutStyle';
import {serviceCard} from './serviceCard';

export function BoldServiceRow() {
  return (
    <div style={{...designContainerStyle(boldServiceRowDocument.container), ...designFlexStyle(boldServiceRowDocument.layout)}}>
      <DesignNodes nodes={boldServiceRowDocument.children} molecules={[serviceCard]} atoms={BOLD_NAIL_ATOMS} />
    </div>
  );
}

export const boldServiceRow = {
  id: 'bold-service-row',
  name: 'Bold service row',
  document: boldServiceRowDocument,
  Component: BoldServiceRow,
} satisfies DesignMolecule & {Component: typeof BoldServiceRow};
