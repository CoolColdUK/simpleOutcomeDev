'use client';

import type {DesignAtomNode, DesignColourTokens, DesignFlex, DesignMolecule, DesignNode} from '@so/model';
import type {CSSProperties} from 'react';

export function designPreviewStyle(tokens: DesignColourTokens): CSSProperties {
  const {colors, fonts, radii} = tokens.chakra.theme.tokens;
  return {
    '--chakra-colors-siteBackground': colors.siteBackground.value,
    '--chakra-colors-siteForeground': colors.siteForeground.value,
    '--chakra-colors-siteAccent': colors.siteAccent.value,
    '--chakra-colors-siteButtonForeground': colors.siteButtonForeground.value,
    '--chakra-colors-siteCard': colors.siteCard.value,
    '--chakra-fonts-siteHeading': fonts.siteHeading.value,
    '--chakra-fonts-siteBody': fonts.siteBody.value,
    '--chakra-radii-site': radii.site.value,
  } as CSSProperties;
}

export function designFlexStyle(layout: DesignFlex | undefined): CSSProperties {
  if (layout === undefined) {
    return {};
  }
  const direction = layout.direction ?? 'row';
  const horizontal = layout.align === undefined ? undefined : flexAlign(layout.align);
  const vertical = layout.valign === undefined ? undefined : flexAlign(layout.valign);
  return {
    display: 'flex',
    flexDirection: layout.direction,
    gap: layout.gapPx,
    flexWrap: layout.wrap,
    justifyContent: direction === 'column' ? vertical : horizontal,
    alignItems: direction === 'column' ? horizontal : vertical,
  };
}

export default function DesignPreview({
  nodes,
  molecules,
  tokens,
  layout,
}: {
  nodes: readonly DesignNode[];
  molecules: readonly DesignMolecule[];
  tokens: DesignColourTokens;
  layout?: DesignFlex;
}) {
  return (
    <div
      className="design-preview"
      data-uppercase={tokens.uppercaseHeadings ? 'true' : 'false'}
      style={{...designPreviewStyle(tokens), ...designFlexStyle(layout)}}
    >
      <DesignNodes nodes={nodes} molecules={molecules} depth={1} />
    </div>
  );
}

function DesignNodes({nodes, molecules, depth}: {nodes: readonly DesignNode[]; molecules: readonly DesignMolecule[]; depth: number}) {
  if (depth > 4) {
    return <p>This composition is nested too deeply.</p>;
  }
  return (
    <>
      {nodes.map((node) => {
        if (node.kind === 'atom') {
          return <DesignAtomView key={node.id} node={node} />;
        }
        const molecule = molecules.find((item) => item.id === node.moleculeId);
        if (molecule === undefined) {
          return <p key={node.id}>Missing molecule {node.moleculeId}</p>;
        }
        return (
          <div key={node.id} style={designFlexStyle(molecule.document.layout)}>
            <DesignNodes nodes={molecule.document.children} molecules={molecules} depth={depth + 1} />
          </div>
        );
      })}
    </>
  );
}

function DesignAtomView({node}: {node: DesignAtomNode}) {
  const style = atomStyle(node);
  const caption = atomCaption(node);
  if (node.atom === 'text') {
    if (node.slots.includes('role')) {
      return <h2 className="design-atom-heading" style={style}>{caption}</h2>;
    }
    return <p className="design-atom-text" style={style}>{caption}</p>;
  }
  if (node.atom === 'link') {
    return (
      <a className="design-atom-link" href="#design" style={style}>
        {caption}
      </a>
    );
  }
  if (node.atom === 'switch') {
    return (
      <label className="design-switch" style={style}>
        <input type="checkbox" readOnly checked={false} />
        {caption}
      </label>
    );
  }
  if (node.atom === 'imageButton') {
    return (
      <a className="design-image-button" href="#design" style={style}>
        <span className="design-image-placeholder">Image</span>
        <span>{caption}</span>
      </a>
    );
  }
  if (node.atom === 'iconButton') {
    return (
      <a className="design-icon-button" href="#design" aria-label={caption} style={style}>
        <span aria-hidden="true">☎</span>
      </a>
    );
  }
  return (
    <a className="design-atom-button" href="#design" style={style}>
      {caption}
    </a>
  );
}

function atomCaption(node: DesignAtomNode): string {
  if (node.slots.includes('text')) {
    return 'Text';
  }
  if (node.slots.includes('label')) {
    return 'Label';
  }
  return node.atom;
}

function atomStyle(node: DesignAtomNode): CSSProperties {
  return {
    background: node.style.background,
    color: node.style.color,
    borderRadius: node.style.radiusPx,
    borderStyle: node.style.borderWidthPx === undefined ? undefined : 'solid',
    borderWidth: node.style.borderWidthPx,
    borderColor: node.style.borderColor,
  };
}

function flexAlign(value: 'start' | 'center' | 'end' | 'stretch'): CSSProperties['justifyContent'] {
  if (value === 'start') {
    return 'flex-start';
  }
  if (value === 'end') {
    return 'flex-end';
  }
  return value;
}
