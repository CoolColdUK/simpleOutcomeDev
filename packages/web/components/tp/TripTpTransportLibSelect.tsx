'use client';

import {Field, NativeSelect, Stack} from '@chakra-ui/react';
import type {DbTpTransportLib} from '@/lib/api/db/tp/loadDbTpWorkspace';

export interface TripTpTransportLibSelectProps {
  readonly label: string;
  readonly value: string;
  readonly transportLib: readonly DbTpTransportLib[];
  readonly disabled?: boolean;
  readonly onChange: (transportLibId: string) => void;
}

export default function TripTpTransportLibSelect({
  label,
  value,
  transportLib,
  disabled,
  onChange,
}: TripTpTransportLibSelectProps) {
  return (
    <Stack gap={2} minW={0} maxW="100%" flex="1">
      <Field.Root>
        <Field.Label>{label}</Field.Label>
        <NativeSelect.Root disabled={disabled}>
          <NativeSelect.Field value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            {transportLib.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
                {t.mode !== undefined && t.mode !== '' ? ` (${t.mode})` : ''}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Field.Root>
    </Stack>
  );
}
