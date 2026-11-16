import {BOLD_NAIL_ATOMS, type DesignOrganism} from '@so/model';
import {boldNailOrganism} from '../boldNailOrganism';
import {DesignNodes} from '../DesignNodes';
import {boldHero} from '../molecules/boldHero';

const source = boldNailOrganism('bold-nail-hero');

export function BoldNailHero() {
  return <DesignNodes nodes={source.document.children} molecules={[boldHero]} atoms={BOLD_NAIL_ATOMS} />;
}

export const boldNailHero = {...source, Component: BoldNailHero} satisfies DesignOrganism & {Component: typeof BoldNailHero};
