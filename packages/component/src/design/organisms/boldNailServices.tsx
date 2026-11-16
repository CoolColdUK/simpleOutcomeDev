import {BOLD_NAIL_ATOMS, type DesignOrganism} from '@so/model';
import {boldNailOrganism} from '../boldNailOrganism';
import {DesignNodes} from '../DesignNodes';
import {boldServiceRow} from '../molecules/boldServiceRow';
import {boldServices} from '../molecules/boldServices';
import {serviceCard} from '../molecules/serviceCard';

const source = boldNailOrganism('bold-nail-services');

export function BoldNailServices() {
  return <DesignNodes nodes={source.document.children} molecules={[boldServices, boldServiceRow, serviceCard]} atoms={BOLD_NAIL_ATOMS} />;
}

export const boldNailServices = {...source, Component: BoldNailServices} satisfies DesignOrganism & {Component: typeof BoldNailServices};
