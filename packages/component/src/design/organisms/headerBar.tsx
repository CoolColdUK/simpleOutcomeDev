import type {DesignOrganism, DesignOrganismDocument} from '@so/model';
import {DesignNodes} from '../DesignNodes';
import {actionRow} from '../molecules/actionRow';

const headerBarDocument: DesignOrganismDocument = {
  children: [
    {id: 'name', kind: 'atom', atom: 'text', style: {}, slots: ['text', 'role']},
    {id: 'actions', kind: 'molecule', moleculeId: 'action-row'},
  ],
};

export function HeaderBar() {
  return <DesignNodes nodes={headerBarDocument.children} molecules={[actionRow]} />;
}

export const headerBar = {
  id: 'header-bar',
  name: 'Header bar',
  category: 'header' as const,
  document: headerBarDocument,
  Component: HeaderBar,
} satisfies DesignOrganism & {Component: typeof HeaderBar};
