import type {DesignMolecule, DesignMoleculeDocument} from '@so/model';
import {DesignNodes} from '../DesignNodes';
import {designFlexStyle} from '../designLayoutStyle';
import {actionRow} from './actionRow';

const groupedDocument: DesignMoleculeDocument = {
  pattern: 'combine',
  layout: {direction: 'column', gapPx: 8},
  children: [
    {id: 'intro', kind: 'atom', atom: 'text', style: {}, slots: ['text']},
    {id: 'actions', kind: 'molecule', moleculeId: 'action-row'},
  ],
};

export function Grouped() {
  return (
    <div style={designFlexStyle(groupedDocument.layout)}>
      <DesignNodes nodes={groupedDocument.children} molecules={[actionRow]} />
    </div>
  );
}

export const grouped = {
  id: 'grouped',
  name: 'Grouped',
  document: groupedDocument,
  Component: Grouped,
} satisfies DesignMolecule & {Component: typeof Grouped};
