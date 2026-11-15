import type {DesignAtom, DesignNode} from './designNode';
import type {DesignMoleculeDocument} from './designMolecule';
import type {DesignOrganismDocument} from './designOrganism';

const SAMPLE_HREF = 'https://www.fresha.com/';

export function blankDesignAtom(atom: DesignAtom, id: string): DesignNode {
  if (atom === 'button') {
    return {id, kind: 'atom', atom, props: {label: 'Button', href: SAMPLE_HREF, background: '#111111', color: '#ffffff'}};
  }
  if (atom === 'iconButton') {
    return {
      id,
      kind: 'atom',
      atom,
      props: {label: 'Call', href: SAMPLE_HREF, icon: 'phone', background: '#111111', color: '#ffffff'},
    };
  }
  if (atom === 'imageButton') {
    return {
      id,
      kind: 'atom',
      atom,
      props: {label: 'See work', href: SAMPLE_HREF, src: 'https://simpleoutcome.dev/', alt: 'Work'},
    };
  }
  if (atom === 'link') {
    return {id, kind: 'atom', atom, props: {label: 'Link', href: SAMPLE_HREF, color: '#111111'}};
  }
  if (atom === 'switch') {
    return {id, kind: 'atom', atom, props: {label: 'Open today', checked: true}};
  }
  return {id, kind: 'atom', atom: 'text', props: {text: 'Text', role: 'body'}};
}

export function blankDesignStack(id: string): DesignNode {
  return {id, kind: 'stack', direction: 'row', gapPx: 12, children: [blankDesignAtom('text', `${id}-text`)]};
}

export function blankDesignMoleculeUse(id: string, moleculeId: string): DesignNode {
  return {id, kind: 'molecule', moleculeId};
}

export function blankMoleculeDocument(): DesignMoleculeDocument {
  return {pattern: 'tree', children: [blankDesignAtom('text', 'label')]};
}

export function blankAccordionDocument(): DesignMoleculeDocument {
  return {pattern: 'accordion', items: [{id: 'item', title: 'Question', body: 'Answer'}]};
}

export function blankOrganismDocument(): DesignOrganismDocument {
  return {children: [blankDesignAtom('text', 'title')]};
}
