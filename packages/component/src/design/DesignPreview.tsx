import type {DesignColourTokens, DesignContainer, DesignFlex, DesignMolecule, DesignNode} from '@so/model';
import {DesignNodes} from './DesignNodes';
import {designContainerStyle, designFlexStyle, designPreviewStyle} from './designLayoutStyle';

export {designPreviewStyle};

export default function DesignPreview({
  nodes,
  molecules,
  tokens,
  layout,
  container,
}: {
  nodes: readonly DesignNode[];
  molecules: readonly DesignMolecule[];
  tokens: DesignColourTokens;
  layout?: DesignFlex;
  container?: DesignContainer;
}) {
  return (
    <div
      className="design-preview"
      data-uppercase={tokens.uppercaseHeadings ? 'true' : 'false'}
      style={{...designPreviewStyle(tokens), ...designContainerStyle(container), ...designFlexStyle(layout)}}
    >
      <DesignNodes nodes={nodes} molecules={molecules} />
    </div>
  );
}
