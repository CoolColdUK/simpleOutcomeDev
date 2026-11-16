'use client';

import {
  DESIGN_ATOMS,
  blankDesignAtom,
  blankDesignMoleculeUse,
  designAtomOptions,
  type DesignAtom,
  type DesignAtomNode,
  type DesignContentKey,
  type DesignMolecule,
  type DesignNode,
  type DesignStyle,
  type DesignStyleKey,
} from '@so/model';
import AdminDesignOptionMenu from '@/components/admin/AdminDesignOptionMenu';
import {AdminIconButton} from '@/components/admin/AdminEditorIcons';

function nextNodeId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `n${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')}`;
}

function isDesignAtom(value: string): value is DesignAtom {
  return DESIGN_ATOMS.some((atom) => atom === value);
}

function styleDefault(key: DesignStyleKey): DesignStyle[DesignStyleKey] {
  if (key === 'radiusPx') {
    return 8;
  }
  if (key === 'borderWidthPx') {
    return 1;
  }
  if (key === 'color') {
    return '#ffffff';
  }
  return '#111111';
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
  return (
    <div>
      {nodes.map((node, index) => (
        <div key={node.id} className="design-node">
          <div className="design-node-head">
            <strong>{node.kind === 'atom' ? node.atom : 'molecule'}</strong>
            <AdminIconButton label="Remove piece" icon="bin" disabled={nodes.length < 2} onClick={() => onChange(nodes.filter((_, nodeIndex) => nodeIndex !== index))} />
          </div>
          <NodeFields
            node={node}
            molecules={choices}
            onChange={(next) => onChange(nodes.map((item, nodeIndex) => (nodeIndex === index ? next : item)))}
          />
        </div>
      ))}
      <AdminDesignOptionMenu
        label="Add piece"
        options={[
          ...DESIGN_ATOMS.map((atom) => ({key: atom, label: atom})),
          ...(choices.length > 0 ? [{key: 'molecule', label: 'molecule'}] : []),
        ]}
        onPick={(key) => {
          if (key === 'molecule') {
            const moleculeId = choices[0]?.id;
            if (moleculeId !== undefined) {
              onChange([...nodes, blankDesignMoleculeUse(nextNodeId(), moleculeId)]);
            }
            return;
          }
          if (isDesignAtom(key)) {
            onChange([...nodes, blankDesignAtom(key, nextNodeId())]);
          }
        }}
      />
    </div>
  );
}

function NodeFields({node, molecules, onChange}: {node: DesignNode; molecules: readonly DesignMolecule[]; onChange: (node: DesignNode) => void}) {
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
  return <AtomFields node={node} onChange={onChange} />;
}

function AtomFields({node, onChange}: {node: DesignAtomNode; onChange: (node: DesignNode) => void}) {
  const options = designAtomOptions(node.atom);
  const available = options.filter((option) => (option.group === 'content' ? !node.slots.includes(option.key) : node.style[option.key as DesignStyleKey] === undefined));
  return (
    <>
      <AdminDesignOptionMenu
        label="Add option"
        icon
        options={available.map((option) => ({key: option.key, label: option.label}))}
        onPick={(key) => {
          const option = options.find((item) => item.key === key);
          if (option === undefined) {
            return;
          }
          if (option.group === 'content') {
            onChange({...node, slots: [...node.slots, option.key as DesignContentKey]});
            return;
          }
          const styleKey = option.key as DesignStyleKey;
          onChange({...node, style: {...node.style, [styleKey]: styleDefault(styleKey)}});
        }}
      />
      {node.slots.map((slot) => (
        <div key={slot} className="design-slot-row">
          <span>{options.find((option) => option.key === slot)?.label ?? slot}</span>
          <span className="admin-muted">Filled in on the template</span>
          <AdminIconButton label={`Remove ${slot}`} icon="bin" onClick={() => onChange({...node, slots: node.slots.filter((item) => item !== slot)})} />
        </div>
      ))}
      {options
        .filter((option) => option.group === 'style' && node.style[option.key as DesignStyleKey] !== undefined)
        .map((option) => (
          <StyleField
            key={option.key}
            optionKey={option.key as DesignStyleKey}
            label={option.label}
            value={node.style[option.key as DesignStyleKey]}
            onChange={(value) => onChange({...node, style: {...node.style, [option.key]: value}})}
            onRemove={() => onChange({...node, style: styleWithout(node.style, option.key as DesignStyleKey)})}
          />
        ))}
    </>
  );
}

function StyleField({
  optionKey,
  label,
  value,
  onChange,
  onRemove,
}: {
  optionKey: DesignStyleKey;
  label: string;
  value: DesignStyle[DesignStyleKey];
  onChange: (value: DesignStyle[DesignStyleKey]) => void;
  onRemove: () => void;
}) {
  return (
    <div className="design-field-row">
      {optionKey === 'radiusPx' || optionKey === 'borderWidthPx' ? (
        <label>
          {label}
          <input type="number" min={0} max={optionKey === 'radiusPx' ? 32 : 8} value={Number(value)} onChange={(event) => onChange(Number(event.target.value))} />
        </label>
      ) : (
        <label>
          {label}
          <input value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />
        </label>
      )}
      <AdminIconButton label={`Remove ${label}`} icon="bin" onClick={onRemove} />
    </div>
  );
}

function styleWithout(style: DesignStyle, key: DesignStyleKey): DesignStyle {
  const next = {...style};
  delete next[key];
  return next;
}

