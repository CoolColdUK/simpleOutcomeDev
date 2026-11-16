import {BOLD_NAIL_ATOMS, type DesignOrganism} from '@so/model';
import {boldNailOrganism} from '../boldNailOrganism';
import {DesignNodes} from '../DesignNodes';
import {boldNav} from '../molecules/boldNav';

const source = boldNailOrganism('bold-nail-header');

export function BoldNailHeader() {
  return <DesignNodes nodes={source.document.children} molecules={[boldNav]} atoms={BOLD_NAIL_ATOMS} />;
}

export const boldNailHeader = {...source, Component: BoldNailHeader} satisfies DesignOrganism & {Component: typeof BoldNailHeader};
