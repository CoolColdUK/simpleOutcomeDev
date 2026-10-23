'use client';

import {Field, NativeSelect, Stack} from '@chakra-ui/react';
import {TP_LOCATION_TYPES, tpLocationTypeLabel} from '@so/model';
import type {DbTpLocation} from '@/lib/api/db/tp/loadDbTpWorkspace';

export interface TripTpLocationSelectProps {
  readonly label: string;
  readonly value: string;
  readonly locations: readonly DbTpLocation[];
  readonly typeFilter: string;
  readonly disabled?: boolean;
  readonly onTypeFilterChange: (type: string) => void;
  readonly onChange: (locationId: string) => void;
}

export default function TripTpLocationSelect({
  label,
  value,
  locations,
  typeFilter,
  disabled,
  onTypeFilterChange,
  onChange,
}: TripTpLocationSelectProps) {
  const filtered =
    typeFilter === ''
      ? locations
      : locations.filter((l) => l.locationType === typeFilter);

  return (
    <Stack gap={2} minW={0} maxW="100%" flex="1">
      <Field.Root>
        <Field.Label>{label}</Field.Label>
        <NativeSelect.Root disabled={disabled}>
          <NativeSelect.Field value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            {filtered.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
                {l.country !== undefined ? ` (${l.country})` : ''}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Field.Root>
      <Field.Root>
        <Field.Label>Filter by type</Field.Label>
        <NativeSelect.Root disabled={disabled}>
          <NativeSelect.Field value={typeFilter} onChange={(e) => onTypeFilterChange(e.target.value)}>
            <option value="">All types</option>
            {TP_LOCATION_TYPES.map((t) => (
              <option key={t} value={t}>{tpLocationTypeLabel(t)}</option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Field.Root>
    </Stack>
  );
}
