import {BOLD_NAIL_ATOMS, type DesignOrganism} from '@so/model';
import {boldNailOrganism} from '../boldNailOrganism';
import {DesignNodes} from '../DesignNodes';
import {footerNote} from '../molecules/footerNote';

const source = boldNailOrganism('bold-nail-footer');

export function BoldNailFooter() {
  return <DesignNodes nodes={source.document.children} molecules={[footerNote]} atoms={BOLD_NAIL_ATOMS} />;
}

export const boldNailFooter = {...source, Component: BoldNailFooter} satisfies DesignOrganism & {Component: typeof BoldNailFooter};
