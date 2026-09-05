'use client';

import {NativeSelect} from '@chakra-ui/react';
import type {DbFpCategory} from '@/lib/api/db/mapDbFpCategory';

export interface FpCategoryAssignSelectProps {
  readonly categories: readonly DbFpCategory[];
  readonly onAssign: (categoryId: string) => void;
}

export default function FpCategoryAssignSelect({categories, onAssign}: FpCategoryAssignSelectProps) {
  return (
    <NativeSelect.Root maxW="220px">
      <NativeSelect.Field
        defaultValue=""
        onChange={(e) => {
          if (e.target.value !== '') {
            onAssign(e.target.value);
            e.target.value = '';
          }
        }}
      >
        <option value="">Assign category…</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </NativeSelect.Field>
    </NativeSelect.Root>
  );
}
