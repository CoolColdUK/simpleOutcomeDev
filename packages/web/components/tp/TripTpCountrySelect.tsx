'use client';

import {useMemo, useState} from 'react';
import {Field, Input, NativeSelect, Stack} from '@chakra-ui/react';
import {filterTpIsoCountries, tpIsoCountryName} from '@so/model';

export interface TripTpCountrySelectProps {
  readonly value: string;
  readonly disabled?: boolean;
  readonly onChange: (code: string) => void;
}

export default function TripTpCountrySelect({value, disabled, onChange}: TripTpCountrySelectProps) {
  const [query, setQuery] = useState('');
  const options = useMemo(() => filterTpIsoCountries(query), [query]);
  const selectedLabel = value !== '' ? tpIsoCountryName(value) : undefined;

  return (
    <Stack gap={2} minW={0} maxW="100%">
      <Field.Root>
        <Field.Label>Search country</Field.Label>
        <Input
          placeholder="Type code or name (e.g. JP, Hong Kong)"
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>Country</Field.Label>
        <NativeSelect.Root disabled={disabled}>
          <NativeSelect.Field value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            {value !== '' && selectedLabel !== undefined && !options.some((c) => c.code === value) ? (
              <option value={value}>{value} · {selectedLabel}</option>
            ) : null}
            {options.map((c) => (
              <option key={c.code} value={c.code}>{c.code} · {c.name}</option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Field.Root>
    </Stack>
  );
}
