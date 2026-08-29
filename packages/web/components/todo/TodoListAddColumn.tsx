'use client';

import {Button, Input, Stack} from '@chakra-ui/react';
import {useState} from 'react';
import createDbTodoColumn from '@/lib/api/db/createDbTodoColumn';

export interface TodoListAddColumnProps {
  readonly podId: string;
  readonly nextSortOrder: number;
  readonly onAdded: () => void;
}

export default function TodoListAddColumn({podId, nextSortOrder, onAdded}: TodoListAddColumnProps) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const add = async (): Promise<void> => {
    setSaving(true);
    try {
      await createDbTodoColumn(podId, title, nextSortOrder);
      setTitle('');
      onAdded();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack minW="240px" gap={2}>
      <Input placeholder="New column" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Button size="sm" colorPalette="brand" loading={saving} disabled={title.trim() === ''} onClick={() => void add()}>
        Add column
      </Button>
    </Stack>
  );
}
