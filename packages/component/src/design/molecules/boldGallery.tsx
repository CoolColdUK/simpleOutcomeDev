import {BOLD_NAIL_ATOMS, boldGalleryDocument, type DesignMolecule} from '@so/model';
import {DesignNodes} from '../DesignNodes';
import {designContainerStyle, designFlexStyle} from '../designLayoutStyle';
import {galleryTile} from './galleryTile';

export function BoldGallery() {
  return (
    <div style={{...designContainerStyle(boldGalleryDocument.container), ...designFlexStyle(boldGalleryDocument.layout)}}>
      <DesignNodes nodes={boldGalleryDocument.children} molecules={[galleryTile]} atoms={BOLD_NAIL_ATOMS} />
    </div>
  );
}

export const boldGallery = {
  id: 'bold-gallery',
  name: 'Bold gallery',
  document: boldGalleryDocument,
  Component: BoldGallery,
} satisfies DesignMolecule & {Component: typeof BoldGallery};
