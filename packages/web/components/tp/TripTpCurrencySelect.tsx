'use client';

import {useMemo, useState} from 'react';
import {Field, Input, NativeSelect, Stack} from '@chakra-ui/react';
import {filterTpIsoCurrencies, tpIsoCurrencyName} from '@so/model';

export interface TripTpCurrencySelectProps {
  readonly value: string;
  readonly disabled?: boolean;
  readonly onChange: (code: string) => void;
}

export default function TripTpCurrencySelect({value, disabled, onChange}: TripTpCurrencySelectProps) {
  const [query, setQuery] = useState('');
  const options = useMemo(() => filterTpIsoCurrencies(query), [query]);
  const selectedLabel = value !== '' ? tpIsoCurrencyName(value) : undefined;

  return (
    <Stack gap={2} minW={0} maxW="100%" flex="1">
      <Field.Root>
        <Field.Label>Search currency</Field.Label>
        <Input
          placeholder="Type code or name (e.g. JPY, yen)"
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>Currency</Field.Label>
        <NativeSelect.Root disabled={disabled}>
          <NativeSelect.Field value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            {value !== '' && selectedLabel === undefined && !options.some((c) => c.code === value) ? (
              <option value={value}>{value}</option>
            ) : null}
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
