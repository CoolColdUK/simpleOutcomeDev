'use client';

import {DESIGN_ATOM_GUIDE, DESIGN_ATOMS, designAtomOptions, type DesignAtom, type DesignOptionDefinition} from '@so/component';
import {blankDesignAtom, blankDesignMoleculeUse, type DesignAtomNode, type DesignMolecule, type DesignNode, type DesignStyle} from '@so/model';
import AdminDesignOptionMenu from '@/components/admin/AdminDesignOptionMenu';
import {AdminIconButton} from '@/components/admin/AdminEditorIcons';

function nextNodeId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `n${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')}`;
}

function atomLabel(atom: string): string {
  return DESIGN_ATOM_GUIDE.find((entry) => entry.atom === atom)?.label ?? atom;
}

function isDesignAtom(value: string): value is DesignAtom {
  return DESIGN_ATOMS.some((atom) => atom === value);
}

function settingInitial(option: DesignOptionDefinition): DesignStyle[string] {
  if (option.initial !== undefined) {
    return option.initial;
  }
  if (option.kind === 'number') {
    return option.min ?? 0;
  }
  if (option.kind === 'boolean') {
    return false;
  }
  if (option.kind === 'choice') {
    return option.values?.[0] ?? '';
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
      <div className="design-node-head">
        <strong>Contents</strong>
        <AdminDesignOptionMenu
          label="Add atom or molecule"
          icon
          options={[
            ...DESIGN_ATOM_GUIDE.map((atom) => ({key: atom.atom, label: atom.label})),
            ...(choices.length > 0 ? [{key: 'molecule', label: 'Molecule'}] : []),
          ]}
          onPick={(key) => addNode(key, choices, nodes, onChange)}
        />
      </div>
      {nodes.map((node, index) => (
        <div key={node.id} className="design-node">
          <div className="design-node-head">
            <strong>{node.kind === 'atom' ? atomLabel(node.atom) : 'Molecule'}</strong>
            <AdminIconButton label="Remove" icon="bin" disabled={nodes.length < 2} onClick={() => onChange(nodes.filter((_, nodeIndex) => nodeIndex !== index))} />
          </div>
          <NodeFields
            node={node}
            molecules={choices}
            onChange={(next) => onChange(nodes.map((item, nodeIndex) => (nodeIndex === index ? next : item)))}
          />
        </div>
      ))}
    </div>
  );
}

function addNode(key: string, choices: readonly DesignMolecule[], nodes: readonly DesignNode[], onChange: (nodes: DesignNode[]) => void): void {
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
  const available = options.filter((option) => (option.group === 'content' ? !node.slots.includes(option.key) : node.style[option.key] === undefined));
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
            onChange({...node, slots: [...node.slots, option.key]});
            return;
          }
          onChange({...node, style: {...node.style, [option.key]: settingInitial(option)}});
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
        .filter((option) => option.group === 'setting' && node.style[option.key] !== undefined)
        .map((option) => (
          <SettingField
            key={option.key}
            option={option}
            value={node.style[option.key]}
            onChange={(value) => onChange({...node, style: {...node.style, [option.key]: value}})}
            onRemove={() => onChange({...node, style: styleWithout(node.style, option.key)})}
          />
        ))}
    </>
  );
}

function SettingField({
  option,
  value,
  onChange,
  onRemove,
}: {
  option: DesignOptionDefinition;
  value: DesignStyle[string] | undefined;
  onChange: (value: DesignStyle[string]) => void;
  onRemove: () => void;
}) {
  return (
    <div className="design-field-row">
      <label>
        {option.label}
        {option.kind === 'number' ? (
          <input type="number" min={option.min ?? 0} max={option.max} value={Number(value)} onChange={(event) => onChange(Number(event.target.value))} />
        ) : null}
        {option.kind === 'boolean' ? <input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} /> : null}
        {option.kind === 'choice' ? (
          <select value={String(value ?? '')} onChange={(event) => onChange(event.target.value)}>
            {(option.values ?? []).map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        ) : null}
        {option.kind === 'text' || option.kind === 'colour' ? (
          <input value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />
        ) : null}
      </label>
      <AdminIconButton label={`Remove ${option.label}`} icon="bin" onClick={onRemove} />
    </div>
  );
}

function styleWithout(style: DesignStyle, key: string): DesignStyle {
  const next = {...style};
  delete next[key];
  return next;
}

