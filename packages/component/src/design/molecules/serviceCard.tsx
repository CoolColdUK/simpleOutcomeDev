import {BOLD_NAIL_ATOMS, serviceCardDocument, type DesignMolecule} from '@so/model';
import {DesignNodes} from '../DesignNodes';
import {designContainerStyle, designFlexStyle} from '../designLayoutStyle';

export function ServiceCard() {
  return (
    <div style={{...designContainerStyle(serviceCardDocument.container), ...designFlexStyle(serviceCardDocument.layout)}}>
      <DesignNodes nodes={serviceCardDocument.children} molecules={[]} atoms={BOLD_NAIL_ATOMS} />
    </div>
  );
}

export const serviceCard = {
  id: 'service-card',
  name: 'Service card',
  document: serviceCardDocument,
  Component: ServiceCard,
} satisfies DesignMolecule & {Component: typeof ServiceCard};
