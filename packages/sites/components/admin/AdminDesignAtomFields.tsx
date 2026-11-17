'use client';

import {DESIGN_ATOMS} from '@so/component';
import {mergedDesignAtom, type DesignAtomPreset} from '@so/model';
import DesignAtomFieldAdd from '@/components/admin/DesignAtomFieldAdd';
import DesignAtomFieldRow from '@/components/admin/DesignAtomFieldRow';
import {keepCompatible, removeField} from '@/components/admin/designAtomFieldForm';

export function DesignAtomPresetFields({
  preset,
  atoms,
  onChange,
}: {
  preset: DesignAtomPreset;
  atoms: readonly DesignAtomPreset[];
  onChange: (preset: DesignAtomPreset) => void;
}) {
  const parent = atoms.find((atom) => atom.id === preset.parentId);
  const inherited = parent === undefined ? [] : mergedDesignAtom(parent, atoms).fields;
  const source = preset.parentId ?? `component:${preset.base}`;
  return (
    <>
      <label>
        Based on
        <select value={source} onChange={(event) => onChange(presetFromSource(preset, event.target.value, atoms))}>
          <optgroup label="Components">
            {DESIGN_ATOMS.map((atom) => (
              <option key={atom} value={`component:${atom}`}>
                {atom}
              </option>
            ))}
          </optgroup>
          <optgroup label="Atoms">
            {atoms
              .filter((atom) => atom.id !== preset.id)
              .map((atom) => (
                <option key={atom.id} value={atom.id}>
                  {atom.name}
                </option>
              ))}
          </optgroup>
        </select>
      </label>
      <p className="admin-muted">
        Prop is the component prop this field sets. Label is the text people see. Group only organises the form. Kind is how the value is edited. A dropdown lists its choices. Setting fields store on this atom. Content fields are filled in on a template.
      </p>
      {inherited.length === 0 ? null : (
        <p className="admin-muted">
          Inherited from {parent?.name}: {inherited.map((field) => field.label).join(', ')}
        </p>
      )}
      <DesignAtomFieldAdd preset={preset} onChange={onChange} />
      {preset.fields.map((field) => (
        <DesignAtomFieldRow key={field.key} preset={preset} field={field} onChange={onChange} onRemove={() => onChange(removeField(preset, field.key))} />
      ))}
    </>
  );
}

function presetFromSource(preset: DesignAtomPreset, source: string, atoms: readonly DesignAtomPreset[]): DesignAtomPreset {
  if (source.startsWith('component:')) {
    return keepCompatible({...preset, base: source.slice('component:'.length), parentId: undefined});
  }
  const parent = atoms.find((atom) => atom.id === source);
  if (parent === undefined) {
    return preset;
  }
  return keepCompatible({...preset, base: parent.base, parentId: parent.id});
}
