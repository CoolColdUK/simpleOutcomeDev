import {BOLD_NAIL_ATOMS, boldServicesDocument, type DesignMolecule} from '@so/model';
import {DesignNodes} from '../DesignNodes';
import {designContainerStyle, designFlexStyle} from '../designLayoutStyle';
import {boldServiceRow} from './boldServiceRow';
import {serviceCard} from './serviceCard';

export function BoldServices() {
  return (
    <div style={{...designContainerStyle(boldServicesDocument.container), ...designFlexStyle(boldServicesDocument.layout)}}>
      <DesignNodes nodes={boldServicesDocument.children} molecules={[boldServiceRow, serviceCard]} atoms={BOLD_NAIL_ATOMS} />
    </div>
  );
}

export const boldServices = {
  id: 'bold-services',
  name: 'Bold services',
  document: boldServicesDocument,
  Component: BoldServices,
} satisfies DesignMolecule & {Component: typeof BoldServices};
