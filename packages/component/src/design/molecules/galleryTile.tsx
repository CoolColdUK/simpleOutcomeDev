import {BOLD_NAIL_ATOMS, galleryTileDocument, type DesignMolecule} from '@so/model';
import {DesignNodes} from '../DesignNodes';
import {designContainerStyle, designFlexStyle} from '../designLayoutStyle';

export function GalleryTile() {
  return (
    <div style={{...designContainerStyle(galleryTileDocument.container), ...designFlexStyle(galleryTileDocument.layout)}}>
      <DesignNodes nodes={galleryTileDocument.children} molecules={[]} atoms={BOLD_NAIL_ATOMS} />
    </div>
  );
}

export const galleryTile = {
  id: 'gallery-tile',
  name: 'Gallery tile',
  document: galleryTileDocument,
  Component: GalleryTile,
} satisfies DesignMolecule & {Component: typeof GalleryTile};
