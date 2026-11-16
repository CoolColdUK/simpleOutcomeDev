'use client';

import {DESIGN_ATOM_GUIDE, DESIGN_ATOMS, designAtomOptions, type DesignAtom, type DesignOptionDefinition} from '@so/component';
import {blankDesignAtom, blankDesignMoleculeUse, type DesignAtomNode, type DesignAtomPreset, type DesignMolecule, type DesignNode, type DesignStyle} from '@so/model';
import AdminDesignOptionMenu from '@/components/admin/AdminDesignOptionMenu';
import DesignColourControl from '@/components/admin/DesignColourControl';
import {designSettingInitial} from '@/components/admin/designSettingInitial';
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

export default function AdminDesignNodeEditor({
  nodes,
  molecules,
  atoms = [],
  excludeMoleculeId,
  onChange,
}: {
  nodes: readonly DesignNode[];
  molecules: readonly DesignMolecule[];
  atoms?: readonly DesignAtomPreset[];
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
            ...atoms.map((atom) => ({key: `preset:${atom.id}`, label: atom.name})),
            ...(choices.length > 0 ? [{key: 'molecule', label: 'Molecule'}] : []),
          ]}
          onPick={(key) => addNode(key, choices, atoms, nodes, onChange)}
        />
      </div>
      {nodes.map((node, index) => (
        <div key={node.id} className="design-node">
          <div className="design-node-head">
            <span className="design-node-title">
              <strong>{node.kind === 'atom' ? (atoms.find((atom) => atom.id === node.presetId)?.name ?? atomLabel(node.atom)) : 'Molecule'}</strong>
              {node.kind === 'molecule' ? <span className="design-tag">Editable</span> : null}
            </span>
            <AdminIconButton label="Remove" icon="bin" disabled={nodes.length < 2} onClick={() => onChange(nodes.filter((_, nodeIndex) => nodeIndex !== index))} />
          </div>
            <NodeFields
            node={node}
            molecules={choices}
            atoms={atoms}
            onChange={(next) => onChange(nodes.map((item, nodeIndex) => (nodeIndex === index ? next : item)))}
          />
        </div>
      ))}
    </div>
  );
}

function addNode(
  key: string,
  choices: readonly DesignMolecule[],
  atoms: readonly DesignAtomPreset[],
  nodes: readonly DesignNode[],
  onChange: (nodes: DesignNode[]) => void,
): void {
  if (key === 'molecule') {
    const moleculeId = choices[0]?.id;
    if (moleculeId !== undefined) {
      onChange([...nodes, blankDesignMoleculeUse(nextNodeId(), moleculeId)]);
    }
    return;
  }
  if (key.startsWith('preset:')) {
    const preset = atoms.find((atom) => atom.id === key.slice('preset:'.length));
    if (preset !== undefined) {
      onChange([...nodes, {id: nextNodeId(), kind: 'atom', atom: preset.base, presetId: preset.id, style: {}, slots: []}]);
    }
    return;
  }
  if (isDesignAtom(key)) {
    onChange([...nodes, blankDesignAtom(key, nextNodeId())]);
  }
}

function NodeFields({
  node,
  molecules,
  atoms,
  onChange,
}: {
  node: DesignNode;
  molecules: readonly DesignMolecule[];
  atoms: readonly DesignAtomPreset[];
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
  return <AtomFields node={node} atoms={atoms} onChange={onChange} />;
}

function AtomFields({node, atoms, onChange}: {node: DesignAtomNode; atoms: readonly DesignAtomPreset[]; onChange: (node: DesignNode) => void}) {
  const preset = atoms.find((atom) => atom.id === node.presetId);
  return (
    <>
      {atoms.length > 0 ? (
        <label>
          Preset
          <select
            value={node.presetId ?? ''}
            onChange={(event) => {
              const next = atoms.find((atom) => atom.id === event.target.value);
              if (next === undefined) {
                const {presetId: _presetId, ...rest} = node;
                onChange({...rest, slots: preset === undefined ? node.slots : preset.fields.filter((field) => field.group === 'content').map((field) => field.key), style: {...(preset?.style ?? {}), ...node.style}});
                return;
              }
              onChange({...node, atom: next.base, presetId: next.id, slots: []});
            }}
          >
            <option value="">Custom</option>
            {atoms
              .filter((atom) => node.presetId !== undefined || atom.base === node.atom)
              .map((atom) => (
                <option key={atom.id} value={atom.id}>
                  {atom.name}
                </option>
              ))}
          </select>
        </label>
      ) : null}
      {preset === undefined ? <AtomOptions node={node} onChange={onChange} /> : <p className="admin-muted">Content and preset style come from {preset.name}. Add an option here only to override that style.</p>}
      {preset === undefined ? null : <AtomOptions node={node} onChange={onChange} settingsOnly />}
    </>
  );
}

function AtomOptions({node, onChange, settingsOnly = false}: {node: DesignAtomNode; onChange: (node: DesignNode) => void; settingsOnly?: boolean}) {
  const options = designAtomOptions(node.atom).filter((option) => (settingsOnly ? option.group === 'setting' : true));
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
          onChange({...node, style: {...node.style, [option.key]: designSettingInitial(option)}});
        }}
      />
      {settingsOnly
        ? null
        : node.slots.map((slot) => (
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
        {option.kind === 'colour' ? <DesignColourControl value={String(value ?? 'siteAccent')} onChange={onChange} /> : null}
        {option.kind === 'text' ? <input value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} /> : null}
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

