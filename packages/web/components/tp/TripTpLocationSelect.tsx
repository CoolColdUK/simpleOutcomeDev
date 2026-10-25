'use client';

import {Field, HStack, NativeSelect} from '@chakra-ui/react';
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
    <HStack wrap="wrap" align="flex-end" minW={0} maxW="100%" flex="1" gap={3}>
      <Field.Root flex="1" minW="8rem">
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
      <Field.Root flex="1" minW="8rem">
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
    </HStack>
  );
}
