import {BOLD_NAIL_ATOMS, boldHeroDocument, type DesignMolecule} from '@so/model';
import {DesignNodes} from '../DesignNodes';
import {designContainerStyle, designFlexStyle} from '../designLayoutStyle';

export function BoldHero() {
  return (
    <div style={{...designContainerStyle(boldHeroDocument.container), ...designFlexStyle(boldHeroDocument.layout)}}>
      <DesignNodes nodes={boldHeroDocument.children} molecules={[]} atoms={BOLD_NAIL_ATOMS} />
    </div>
  );
}

export const boldHero = {
  id: 'bold-hero',
  name: 'Bold hero',
  document: boldHeroDocument,
  Component: BoldHero,
} satisfies DesignMolecule & {Component: typeof BoldHero};
