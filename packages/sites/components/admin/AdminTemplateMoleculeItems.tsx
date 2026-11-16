'use client';

import {listMoleculeContentFields} from '@so/component';
import type {DesignAtomPreset, DesignMolecule, DesignTemplateItem} from '@so/model';
import {AdminIconButton} from '@/components/admin/AdminEditorIcons';

function nextItemId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `item${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')}`;
}

export default function AdminTemplateMoleculeItems({
  items,
  molecules,
  atoms = [],
  onChange,
}: {
  items: readonly DesignTemplateItem[];
  molecules: readonly DesignMolecule[];
  atoms?: readonly DesignAtomPreset[];
  onChange: (items: DesignTemplateItem[]) => void;
}) {
  return (
    <div className="admin-card">
      <h2>Molecule items</h2>
      <p className="admin-muted">Add a molecule here and fill the options it exposes. The molecule itself only stores layout and style.</p>
      {items.map((item, index) => {
        const molecule = molecules.find((entry) => entry.id === item.moleculeId);
        const fields = molecule === undefined ? [] : listMoleculeContentFields(molecule, molecules, atoms);
        return (
          <div key={item.id} className="design-node">
            <div className="design-node-head">
              <strong>{molecule?.name ?? item.moleculeId}</strong>
              <AdminIconButton label="Remove item" icon="bin" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} />
            </div>
            {fields.length === 0 ? <p className="admin-muted">This molecule has no content options yet.</p> : null}
            {fields.map((field) => (
              <label key={`${field.nodeId}-${field.slot}`}>
                {field.label}
                {field.kind === 'boolean' ? (
                  <input
                    type="checkbox"
                    checked={item.values[field.nodeId]?.[field.slot] === true}
                    onChange={(event) => onChange(setValue(items, index, field.nodeId, field.slot, event.target.checked))}
                  />
                ) : null}
                {field.kind === 'choice' ? (
                  <select
                    value={textValue(item, field.nodeId, field.slot)}
                    onChange={(event) => onChange(setValue(items, index, field.nodeId, field.slot, event.target.value))}
                  >
                    <option value="">Choose</option>
                    {(field.values ?? []).map((choice) => (
                      <option key={choice} value={choice}>
                        {choice}
                      </option>
                    ))}
                  </select>
                ) : null}
                {field.kind === 'text' ? (
                  <input
                    value={textValue(item, field.nodeId, field.slot)}
                    onChange={(event) => onChange(setValue(items, index, field.nodeId, field.slot, event.target.value))}
                  />
                ) : null}
              </label>
            ))}
          </div>
        );
      })}
      <label>
        Add molecule
        <select
          value=""
          onChange={(event) => {
            const moleculeId = event.target.value;
            if (moleculeId.length > 0) {
              onChange([...items, {id: nextItemId(), moleculeId, values: {}}]);
            }
          }}
        >
          <option value="">Choose</option>
          {molecules.map((molecule) => (
            <option key={molecule.id} value={molecule.id}>
              {molecule.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function textValue(item: DesignTemplateItem, nodeId: string, slot: string): string {
  const value = item.values[nodeId]?.[slot];
  return typeof value === 'string' ? value : '';
}

function setValue(items: readonly DesignTemplateItem[], index: number, nodeId: string, slot: string, value: string | boolean): DesignTemplateItem[] {
  return items.map((item, itemIndex) => {
    if (itemIndex !== index) {
      return item;
    }
    return {...item, values: {...item.values, [nodeId]: {...item.values[nodeId], [slot]: value}}};
  });
}
