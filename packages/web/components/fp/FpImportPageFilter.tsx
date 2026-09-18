'use client';

import {Button, Group} from '@chakra-ui/react';

export type FpImportStatusFilter = 'all' | 'active' | 'archived';

export interface FpImportPageFilterProps {
  readonly value: FpImportStatusFilter;
  readonly onChange: (value: FpImportStatusFilter) => void;
}

const OPTIONS: readonly {readonly id: FpImportStatusFilter; readonly label: string}[] = [
  {id: 'all', label: 'All'},
  {id: 'active', label: 'Active'},
  {id: 'archived', label: 'Archived'},
];

export default function FpImportPageFilter({value, onChange}: FpImportPageFilterProps) {
  return (
    <Group attached>
      {OPTIONS.map((option) => (
        <Button
          key={option.id}
          size="sm"
          variant={value === option.id ? 'solid' : 'outline'}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </Button>
      ))}
    </Group>
  );
}
