'use client';

import {Button, HStack, Input, NativeSelect} from '@chakra-ui/react';
import {useState} from 'react';
import type {DbTodoColumn} from '@/lib/api/db/listDbTodoColumns';
import createDbTodoCard from '@/lib/api/db/createDbTodoCard';

export interface TodoListBoardSingleListAddProps {
  readonly podId: string;
  readonly userId: string;
  readonly columns: readonly DbTodoColumn[];
  readonly cardCountByColumn: Readonly<Record<string, number>>;
  readonly onChanged: () => void;
}

export default function TodoListBoardSingleListAdd({
  podId,
  userId,
  columns,
  cardCountByColumn,
  onChanged,
}: TodoListBoardSingleListAddProps) {
  const firstColumnId = columns[0]?.id ?? '';
  const [columnId, setColumnId] = useState(firstColumnId);
  const [title, setTitle] = useState('');
  const selected = columns.some((c) => c.id === columnId) ? columnId : firstColumnId;

  const addCard = async (): Promise<void> => {
    if (selected === '') {
      return;
    }
    await createDbTodoCard(podId, selected, title, userId, cardCountByColumn[selected] ?? 0);
    setTitle('');
    onChanged();
  };

  if (columns.length === 0) {
    return null;
  }

  return (
    <HStack gap={2} flexWrap="wrap" align="end">
      <NativeSelect.Root w={{base: 'full', sm: '200px'}}>
        <NativeSelect.Field value={selected} onChange={(e) => setColumnId(e.target.value)}>
          {columns.map((column) => (
            <option key={column.id} value={column.id}>
              {column.title}
            </option>
          ))}
        </NativeSelect.Field>
      </NativeSelect.Root>
      <Input
        flex="1"
        minW="160px"
        placeholder="New card"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Button size="sm" disabled={title.trim() === ''} onClick={() => void addCard()}>
        Add card
      </Button>
    </HStack>
  );
}
