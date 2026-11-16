import {BOLD_NAIL_ATOMS, type DesignOrganism} from '@so/model';
import {boldNailOrganism} from '../boldNailOrganism';
import {DesignNodes} from '../DesignNodes';
import {boldGallery} from '../molecules/boldGallery';
import {galleryTile} from '../molecules/galleryTile';

const source = boldNailOrganism('bold-nail-gallery');

export function BoldNailGallery() {
  return <DesignNodes nodes={source.document.children} molecules={[boldGallery, galleryTile]} atoms={BOLD_NAIL_ATOMS} />;
}

export const boldNailGallery = {...source, Component: BoldNailGallery} satisfies DesignOrganism & {Component: typeof BoldNailGallery};
