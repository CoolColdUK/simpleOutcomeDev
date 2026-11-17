'use client';

import {Box} from '@chakra-ui/react';
import type {DesignAtomPreset, DesignColourTokens, DesignContainer, DesignFlex, DesignMolecule, DesignNode} from '@so/model';
import {DesignNodes} from './DesignNodes';
import DesignThemeProvider from './DesignThemeProvider';
import {designContainerStyle, designFlexStyle, designPreviewStyle} from './designLayoutStyle';

export {designPreviewStyle};

export default function DesignPreview({
  nodes,
  molecules,
  atoms = [],
  tokens,
  layout,
  container,
}: {
  nodes: readonly DesignNode[];
  molecules: readonly DesignMolecule[];
  atoms?: readonly DesignAtomPreset[];
  tokens: DesignColourTokens;
  layout?: DesignFlex;
  container?: DesignContainer;
}) {
  return (
    <DesignThemeProvider tokens={tokens}>
      <Box
        className="design-preview"
        data-uppercase={tokens.uppercaseHeadings ? 'true' : 'false'}
        bg="siteBackground"
        color="siteForeground"
        fontFamily="siteBody"
        borderRadius="site"
        style={{...designPreviewStyle(tokens), ...designContainerStyle(container), ...designFlexStyle(layout)}}
      >
        <DesignNodes nodes={nodes} molecules={molecules} atoms={atoms} />
      </Box>
    </DesignThemeProvider>
  );
}
