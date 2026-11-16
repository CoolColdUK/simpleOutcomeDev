import type {DesignOrganism, DesignOrganismDocument} from '@so/model';
import {DesignNodes} from '../DesignNodes';
import {actionRow} from '../molecules/actionRow';
import {grouped} from '../molecules/grouped';

const pageBandDocument: DesignOrganismDocument = {
  children: [
    {id: 'title', kind: 'atom', atom: 'text', style: {}, slots: ['text']},
    {id: 'body', kind: 'atom', atom: 'text', style: {}, slots: ['text']},
    {id: 'actions', kind: 'molecule', moleculeId: 'action-row'},
    {id: 'group', kind: 'molecule', moleculeId: 'grouped'},
  ],
};

export function PageBand() {
  return <DesignNodes nodes={pageBandDocument.children} molecules={[actionRow, grouped]} />;
}

export const pageBand = {
  id: 'page-band',
  name: 'Page band',
  category: 'page' as const,
  document: pageBandDocument,
  Component: PageBand,
} satisfies DesignOrganism & {Component: typeof PageBand};
