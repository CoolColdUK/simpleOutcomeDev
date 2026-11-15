'use client';

import type {DesignAccordionItem, DesignColourTokens, DesignMolecule, DesignNode} from '@so/model';
import type {CSSProperties} from 'react';
import {useState} from 'react';

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

export default function DesignPreview({
  nodes,
  molecules,
  tokens,
}: {
  nodes: readonly DesignNode[];
  molecules: readonly DesignMolecule[];
  tokens: DesignColourTokens;
}) {
  return (
    <div className="design-preview" data-uppercase={tokens.uppercaseHeadings ? 'true' : 'false'} style={designPreviewStyle(tokens)}>
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
        if (node.kind === 'stack') {
          return (
            <div key={node.id} className={node.direction === 'row' ? 'design-row' : 'design-stack-column'} style={{gap: node.gapPx}}>
              <DesignNodes nodes={node.children} molecules={molecules} depth={depth + 1} />
            </div>
          );
        }
        const molecule = molecules.find((item) => item.id === node.moleculeId);
        if (molecule === undefined) {
          return <p key={node.id}>Missing molecule {node.moleculeId}</p>;
        }
        if (molecule.document.pattern === 'accordion') {
          return <DesignAccordion key={node.id} items={molecule.document.items} />;
        }
        return <DesignNodes key={node.id} nodes={molecule.document.children} molecules={molecules} depth={depth + 1} />;
      })}
    </>
  );
}

function DesignAccordion({items}: {items: readonly DesignAccordionItem[]}) {
  const [openId, setOpenId] = useState<string | undefined>(items[0]?.id);
  return (
    <div className="design-accordion">
      {items.map((item) => (
        <div key={item.id}>
          <button type="button" className="design-atom-button" aria-expanded={openId === item.id} onClick={() => setOpenId(openId === item.id ? undefined : item.id)}>
            {item.title}
          </button>
          {openId === item.id ? <p className="design-atom-text">{item.body}</p> : null}
        </div>
      ))}
    </div>
  );
}

function DesignAtomView({node}: {node: Extract<DesignNode, {kind: 'atom'}>}) {
  if (node.atom === 'text') {
    if (node.props.role === 'heading') {
      return <h2 className="design-atom-heading">{node.props.text}</h2>;
    }
    return <p className="design-atom-text">{node.props.text}</p>;
  }
  if (node.atom === 'link') {
    return (
      <a className="design-atom-link" href={node.props.href} style={{color: node.props.color}}>
        {node.props.label}
      </a>
    );
  }
  if (node.atom === 'switch') {
    return <DesignSwitch label={node.props.label} checked={node.props.checked} />;
  }
  if (node.atom === 'imageButton') {
    return (
      <a className="design-image-button" href={node.props.href}>
        <img src={node.props.src} alt={node.props.alt} />
        <span>{node.props.label}</span>
      </a>
    );
  }
  if (node.atom === 'iconButton') {
    return (
      <a className="design-icon-button" href={node.props.href} aria-label={node.props.label} style={{background: node.props.background, color: node.props.color}}>
        <AtomIcon name={node.props.icon} />
      </a>
    );
  }
  return (
    <a className="design-atom-button" href={node.props.href} style={{background: node.props.background, color: node.props.color}}>
      {node.props.label}
    </a>
  );
}

function DesignSwitch({label, checked}: {label: string; checked: boolean}) {
  const [on, setOn] = useState(checked);
  return (
    <label className="design-switch">
      <input type="checkbox" checked={on} onChange={(event) => setOn(event.target.checked)} />
      {label}
    </label>
  );
}

function AtomIcon({name}: {name: string}) {
  if (name === 'phone') {
    return <span aria-hidden="true">☎</span>;
  }
  if (name === 'close') {
    return <span aria-hidden="true">×</span>;
  }
  if (name === 'arrow') {
    return <span aria-hidden="true">→</span>;
  }
  return <span aria-hidden="true">☰</span>;
}
