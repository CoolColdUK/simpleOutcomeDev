'use client';

import {designAtomOptions} from '@so/component/server';
import {DesignFieldKind, type DesignAtomPreset} from '@so/model';
import {useState} from 'react';
import DesignChoiceTags from '@/components/admin/DesignChoiceTags';
import {addField, addFieldError, EMPTY_FIELD_DRAFT, FIELD_GROUPS, FIELD_KINDS, fieldFromDraft, suggestDraft, type FieldDraft} from '@/components/admin/designAtomFieldForm';

export default function DesignAtomFieldAdd({preset, onChange}: {preset: DesignAtomPreset; onChange: (preset: DesignAtomPreset) => void}) {
  const [draft, setDraft] = useState<FieldDraft>(EMPTY_FIELD_DRAFT);
  const [error, setError] = useState('');
  return (
    <div className="design-node">
      <strong>Add field</strong>
      <div className="design-field-row">
        <label>
          Prop
          <input
            value={draft.key}
            maxLength={41}
            placeholder="href"
            onChange={(event) => setDraft({...draft, key: event.target.value})}
            onBlur={() => setDraft(suggest(preset, draft))}
          />
        </label>
        <label>
          Label
          <input value={draft.label} maxLength={40} onChange={(event) => setDraft({...draft, label: event.target.value})} />
        </label>
        <label>
          Group
          <select value={draft.group} onChange={(event) => setDraft({...draft, group: groupValue(event.target.value)})}>
            {FIELD_GROUPS.map((group) => (
              <option key={group.group} value={group.group}>
                {group.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Kind
          <select value={draft.kind} onChange={(event) => setDraft({...draft, kind: kindValue(event.target.value)})}>
            {FIELD_KINDS.map((kind) => (
              <option key={kind.kind} value={kind.kind}>
                {kind.label}
              </option>
            ))}
          </select>
        </label>
        {draft.kind === 'choice' ? <DesignChoiceTags values={draft.values} onChange={(values) => setDraft({...draft, values})} /> : null}
        <button
          type="button"
          onClick={() => {
            const reason = addFieldError(preset, draft);
            if (reason !== undefined) {
              setError(reason);
              return;
            }
            onChange(addField(preset, fieldFromDraft(draft), designAtomOptions(preset.base)));
            setDraft(EMPTY_FIELD_DRAFT);
            setError('');
          }}
        >
          Add
        </button>
      </div>
      {error.length === 0 ? null : <p className="admin-muted">{error}</p>}
    </div>
  );
}

function suggest(preset: DesignAtomPreset, draft: FieldDraft): FieldDraft {
  const key = draft.key.trim();
  const untouched = draft.label.trim().length === 0 && draft.group === 'content' && draft.kind === DesignFieldKind.TEXT && draft.values.length === 0;
  if (!untouched) {
    return {...draft, key};
  }
  const option = designAtomOptions(preset.base).find((item) => item.key === key);
  if (option === undefined) {
    return {...draft, key};
  }
  return {...draft, key, ...suggestDraft(option)};
}

function groupValue(value: string): FieldDraft['group'] {
  if (value === 'setting') {
    return 'setting';
  }
  return 'content';
}

function kindValue(value: string): FieldDraft['kind'] {
  const kind = FIELD_KINDS.find((item) => item.kind === value);
  return kind === undefined ? DesignFieldKind.TEXT : kind.kind;
}
