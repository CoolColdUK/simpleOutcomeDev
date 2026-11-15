'use client';

import {
  DESIGN_ATOMS,
  SITE_BLOCK_ICONS,
  blankDesignAtom,
  blankDesignMoleculeUse,
  blankDesignStack,
  type DesignAtom,
  type DesignMolecule,
  type DesignNode,
} from '@so/model';

function nextNodeId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `n${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')}`;
}

function isDesignAtom(value: string): value is DesignAtom {
  return DESIGN_ATOMS.some((atom) => atom === value);
}

export default function AdminDesignNodeEditor({
  nodes,
  molecules,
  excludeMoleculeId,
  onChange,
}: {
  nodes: readonly DesignNode[];
  molecules: readonly DesignMolecule[];
  excludeMoleculeId?: string;
  onChange: (nodes: DesignNode[]) => void;
}) {
  const choices = molecules.filter((molecule) => molecule.id !== excludeMoleculeId);
  const replace = (index: number, next: DesignNode): void => {
    onChange(nodes.map((node, nodeIndex) => (nodeIndex === index ? next : node)));
  };
  return (
    <div>
      {nodes.map((node, index) => (
        <div key={node.id} className="design-node">
          <div className="admin-actions">
            <strong>{node.kind === 'atom' ? node.atom : node.kind}</strong>
            <button
              type="button"
              className="secondary"
              disabled={nodes.length < 2}
              onClick={() => onChange(nodes.filter((_, nodeIndex) => nodeIndex !== index))}
            >
              Remove
            </button>
          </div>
          <NodeFields
            node={node}
            molecules={choices}
            excludeMoleculeId={excludeMoleculeId}
            onChange={(next) => replace(index, next)}
          />
        </div>
      ))}
      <label>
        Add
        <select
          value=""
          onChange={(event) => {
            const value = event.target.value;
            if (value === 'stack') {
              onChange([...nodes, blankDesignStack(nextNodeId())]);
              return;
            }
            if (value === 'molecule') {
              const moleculeId = choices[0]?.id;
              if (moleculeId === undefined) {
                return;
              }
              onChange([...nodes, blankDesignMoleculeUse(nextNodeId(), moleculeId)]);
              return;
            }
            if (isDesignAtom(value)) {
              onChange([...nodes, blankDesignAtom(value, nextNodeId())]);
            }
          }}
        >
          <option value="">Choose a piece</option>
          {DESIGN_ATOMS.map((atom) => (
            <option key={atom} value={atom}>
              {atom}
            </option>
          ))}
          <option value="stack">stack</option>
          <option value="molecule">molecule</option>
        </select>
      </label>
    </div>
  );
}

function NodeFields({
  node,
  molecules,
  excludeMoleculeId,
  onChange,
}: {
  node: DesignNode;
  molecules: readonly DesignMolecule[];
  excludeMoleculeId?: string;
  onChange: (node: DesignNode) => void;
}) {
  if (node.kind === 'molecule') {
    return (
      <label>
        Molecule
        <select value={node.moleculeId} onChange={(event) => onChange({...node, moleculeId: event.target.value})}>
          {molecules.map((molecule) => (
            <option key={molecule.id} value={molecule.id}>
              {molecule.name}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (node.kind === 'stack') {
    return (
      <>
        <label>
          Direction
          <select
            value={node.direction}
            onChange={(event) => onChange({...node, direction: event.target.value === 'column' ? 'column' : 'row'})}
          >
            <option value="row">row</option>
            <option value="column">column</option>
          </select>
        </label>
        <label>
          Gap
          <input
            type="number"
            min={0}
            max={64}
            value={node.gapPx}
            onChange={(event) => onChange({...node, gapPx: Number(event.target.value)})}
          />
        </label>
        <AdminDesignNodeEditor
          nodes={node.children}
          molecules={molecules}
          excludeMoleculeId={excludeMoleculeId}
          onChange={(children) => onChange({...node, children})}
        />
      </>
    );
  }
  if (node.atom === 'button') {
    const button = node;
    return (
      <>
        <TextField label="Label" value={button.props.label} onChange={(label) => onChange({...button, props: {...button.props, label}})} />
        <TextField label="URL" value={button.props.href} onChange={(href) => onChange({...button, props: {...button.props, href}})} />
        <TextField label="Background" value={button.props.background} onChange={(background) => onChange({...button, props: {...button.props, background}})} />
        <TextField label="Colour" value={button.props.color} onChange={(color) => onChange({...button, props: {...button.props, color}})} />
      </>
    );
  }
  if (node.atom === 'iconButton') {
    const iconButton = node;
    return (
      <>
        <TextField label="Label" value={iconButton.props.label} onChange={(label) => onChange({...iconButton, props: {...iconButton.props, label}})} />
        <TextField label="URL" value={iconButton.props.href} onChange={(href) => onChange({...iconButton, props: {...iconButton.props, href}})} />
        <TextField label="Background" value={iconButton.props.background} onChange={(background) => onChange({...iconButton, props: {...iconButton.props, background}})} />
        <TextField label="Colour" value={iconButton.props.color} onChange={(color) => onChange({...iconButton, props: {...iconButton.props, color}})} />
        <label>
          Icon
          <select value={iconButton.props.icon} onChange={(event) => onChange({...iconButton, props: {...iconButton.props, icon: iconOf(event.target.value)}})}>
            {SITE_BLOCK_ICONS.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>
        </label>
      </>
    );
  }
  if (node.atom === 'imageButton') {
    return (
      <>
        <TextField label="Label" value={node.props.label} onChange={(label) => onChange({...node, props: {...node.props, label}})} />
        <TextField label="URL" value={node.props.href} onChange={(href) => onChange({...node, props: {...node.props, href}})} />
        <TextField label="Image URL" value={node.props.src} onChange={(src) => onChange({...node, props: {...node.props, src}})} />
        <TextField label="Alt" value={node.props.alt} onChange={(alt) => onChange({...node, props: {...node.props, alt}})} />
      </>
    );
  }
  if (node.atom === 'link') {
    return (
      <>
        <TextField label="Label" value={node.props.label} onChange={(label) => onChange({...node, props: {...node.props, label}})} />
        <TextField label="URL" value={node.props.href} onChange={(href) => onChange({...node, props: {...node.props, href}})} />
        <TextField label="Colour" value={node.props.color} onChange={(color) => onChange({...node, props: {...node.props, color}})} />
      </>
    );
  }
  if (node.atom === 'switch') {
    return (
      <>
        <TextField label="Label" value={node.props.label} onChange={(label) => onChange({...node, props: {...node.props, label}})} />
        <label>
          <input
            type="checkbox"
            checked={node.props.checked}
            onChange={(event) => onChange({...node, props: {...node.props, checked: event.target.checked}})}
          />{' '}
          Checked
        </label>
      </>
    );
  }
  return (
    <>
      <TextField label="Text" value={node.props.text} onChange={(text) => onChange({...node, props: {...node.props, text}})} />
      <label>
        Role
        <select value={node.props.role} onChange={(event) => onChange({...node, props: {...node.props, role: event.target.value === 'heading' ? 'heading' : 'body'}})}>
          <option value="body">body</option>
          <option value="heading">heading</option>
        </select>
      </label>
    </>
  );
}

function iconOf(value: string): (typeof SITE_BLOCK_ICONS)[number] {
  return SITE_BLOCK_ICONS.find((icon) => icon === value) ?? 'menu';
}

function TextField({label, value, onChange}: {label: string; value: string; onChange: (value: string) => void}) {
  return (
    <label>
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
