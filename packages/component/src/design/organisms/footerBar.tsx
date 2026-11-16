import type {DesignOrganism, DesignOrganismDocument} from '@so/model';
import {DesignNodes} from '../DesignNodes';

const footerBarDocument: DesignOrganismDocument = {
  children: [
    {id: 'line', kind: 'atom', atom: 'text', style: {}, slots: ['text']},
    {id: 'home', kind: 'atom', atom: 'link', style: {color: '#111111'}, slots: ['label', 'href']},
  ],
};

export function FooterBar() {
  return <DesignNodes nodes={footerBarDocument.children} molecules={[]} />;
}

export const footerBar = {
  id: 'footer-bar',
  name: 'Footer bar',
  category: 'footer' as const,
  document: footerBarDocument,
  Component: FooterBar,
} satisfies DesignOrganism & {Component: typeof FooterBar};
