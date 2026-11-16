import {BOLD_NAIL_ORGANISMS, type DesignOrganism} from '@so/model';

export function boldNailOrganism(id: string): DesignOrganism {
  const organism = BOLD_NAIL_ORGANISMS.find((item) => item.id === id);
  if (organism === undefined) {
    throw new Error(`Missing section ${id}`);
  }
  return organism;
}
