'use client';

import {Field, NativeSelect, Stack} from '@chakra-ui/react';
import type {DbTpTransportLib} from '@/lib/api/db/tp/loadDbTpWorkspace';
import {TP_TRANSPORT_MODES} from '@/components/tp/tpTransportModes';

export interface TripTpTransportLibSelectProps {
  readonly label: string;
  readonly value: string;
  readonly transportLib: readonly DbTpTransportLib[];
  readonly modeFilter: string;
  readonly disabled?: boolean;
  readonly onModeFilterChange: (mode: string) => void;
  readonly onChange: (transportLibId: string) => void;
}

export default function TripTpTransportLibSelect({
  label,
  value,
  transportLib,
  modeFilter,
  disabled,
  onModeFilterChange,
  onChange,
}: TripTpTransportLibSelectProps) {
  const filtered =
    modeFilter === ''
      ? transportLib
      : transportLib.filter((t) => (t.mode ?? 'other') === modeFilter);

  return (
    <Stack gap={2} minW={0} maxW="100%">
      <Field.Root>
        <Field.Label>{label}</Field.Label>
        <NativeSelect.Root disabled={disabled}>
          <NativeSelect.Field value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            {filtered.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
                {t.mode !== undefined ? ` (${t.mode})` : ''}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Field.Root>
      <Field.Root>
        <Field.Label>Filter by mode</Field.Label>
        <NativeSelect.Root disabled={disabled}>
          <NativeSelect.Field value={modeFilter} onChange={(e) => onModeFilterChange(e.target.value)}>
            <option value="">All modes</option>
            {TP_TRANSPORT_MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Field.Root>
    </Stack>
  );
}
