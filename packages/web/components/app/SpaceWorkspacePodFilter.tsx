'use client';

import {Button, Group} from '@chakra-ui/react';

export type SpacePodListFilter = 'all' | 'active' | 'archived';

export interface SpaceWorkspacePodFilterProps {
  readonly value: SpacePodListFilter;
  readonly onChange: (value: SpacePodListFilter) => void;
}

const OPTIONS: readonly {readonly id: SpacePodListFilter; readonly label: string}[] = [
  {id: 'all', label: 'All'},
  {id: 'active', label: 'Active'},
  {id: 'archived', label: 'Archived'},
];

export default function SpaceWorkspacePodFilter({value, onChange}: SpaceWorkspacePodFilterProps) {
  return (
    <Group attached>
      {OPTIONS.map((option) => (
        <Button
          key={option.id}
          size="sm"
          colorPalette="brand"
          variant={value === option.id ? 'solid' : 'outline'}
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </Button>
      ))}
    </Group>
  );
}
