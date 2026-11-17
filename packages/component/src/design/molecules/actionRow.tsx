import type {DesignMolecule, DesignMoleculeDocument} from '@so/model';
import {DesignNodes} from '../DesignNodes';
import {designFlexStyle} from '../designLayoutStyle';

const actionRowDocument: DesignMoleculeDocument = {
  pattern: 'tree',
  layout: {direction: 'row', gapPx: 12, align: 'center', valign: 'center', wrap: 'wrap'},
  children: [
    {id: 'book', kind: 'atom', atom: 'button', style: {background: 'siteAccent', color: 'siteButtonForeground', borderRadius: 16}, slots: ['label', 'href']},
    {id: 'call', kind: 'atom', atom: 'iconButton', style: {background: 'siteAccent', color: 'siteButtonForeground', borderRadius: 16}, slots: ['label', 'href', 'icon']},
    {id: 'photo', kind: 'atom', atom: 'imageButton', style: {borderRadius: 16, background: 'siteCard'}, slots: ['label', 'href', 'src', 'alt']},
  ],
};

export function ActionRow() {
  return (
    <div style={designFlexStyle(actionRowDocument.layout)}>
      <DesignNodes nodes={actionRowDocument.children} molecules={[]} />
    </div>
  );
}

export const actionRow = {
  id: 'action-row',
  name: 'Action row',
  document: actionRowDocument,
  Component: ActionRow,
} satisfies DesignMolecule & {Component: typeof ActionRow};
