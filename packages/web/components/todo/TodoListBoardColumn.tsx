'use client';

import {Button, Heading, HStack, Input, Stack} from '@chakra-ui/react';
import {useDroppable} from '@dnd-kit/core';
import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {useState} from 'react';
import type {DbTodoColumn} from '@/lib/api/db/listDbTodoColumns';
import type {DbTodoCard} from '@/lib/api/db/mapDbTodoCard';
import TodoListBoardCard from '@/components/todo/TodoListBoardCard';
import updateDbTodoColumn from '@/lib/api/db/updateDbTodoColumn';
import deleteDbTodoColumn from '@/lib/api/db/deleteDbTodoColumn';
import archiveDbTodoCardsByColumn from '@/lib/api/db/archiveDbTodoCardsByColumn';
import createDbTodoCard from '@/lib/api/db/createDbTodoCard';
import reorderDbTodoColumns from '@/lib/api/db/reorderDbTodoColumns';

export interface TodoListBoardColumnProps {
  readonly column: DbTodoColumn;
  readonly columnIds: readonly string[];
  readonly cards: readonly DbTodoCard[];
  readonly canManageColumns: boolean;
  readonly userId: string;
  readonly assigneeName: (userId: string | undefined) => string | undefined;
  readonly onOpenCard: (card: DbTodoCard) => void;
  readonly onChanged: () => void;
}

export default function TodoListBoardColumn({
  column,
  columnIds,
  cards,
  canManageColumns,
  userId,
  assigneeName,
  onOpenCard,
  onChanged,
}: TodoListBoardColumnProps) {
  const {setNodeRef} = useDroppable({id: column.id});
  const [title, setTitle] = useState(column.title);
  const [cardTitle, setCardTitle] = useState('');

  const saveTitle = async (): Promise<void> => {
    await updateDbTodoColumn(column.id, title);
    onChanged();
  };

  const move = async (delta: number): Promise<void> => {
    const from = columnIds.indexOf(column.id);
    const to = from + delta;
    if (to < 0 || to >= columnIds.length) {
      return;
    }
    const without = columnIds.filter((id) => id !== column.id);
    const ids = [...without.slice(0, to), column.id, ...without.slice(to)];
    await reorderDbTodoColumns(ids);
    onChanged();
  };

  const addCard = async (): Promise<void> => {
    await createDbTodoCard(column.podId, column.id, cardTitle, userId, cards.length);
    setCardTitle('');
    onChanged();
  };

  return (
    <Stack ref={setNodeRef} minW="260px" maxW="280px" gap={2} p={2} borderWidth="1px" borderRadius="md" bg="bg.subtle">
      {canManageColumns ? (
        <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => void saveTitle()} />
      ) : (
        <Heading as="h3" size="sm">
          {column.title}
        </Heading>
      )}
      {canManageColumns ? (
        <HStack>
          <Button size="xs" variant="outline" onClick={() => void move(-1)}>
            Left
          </Button>
          <Button size="xs" variant="outline" onClick={() => void move(1)}>
            Right
          </Button>
          <Button size="xs" variant="outline" onClick={() => void archiveDbTodoCardsByColumn(column.id).then(onChanged)}>
            Archive all
          </Button>
          <Button size="xs" variant="ghost" onClick={() => void deleteDbTodoColumn(column.id).then(onChanged)}>
            Delete
          </Button>
        </HStack>
      ) : (
        <Button size="xs" variant="outline" onClick={() => void archiveDbTodoCardsByColumn(column.id).then(onChanged)}>
          Archive all
        </Button>
      )}
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {cards.map((card) => (
          <TodoListBoardCard
            key={card.id}
            card={card}
            columnTitle={column.title}
            assigneeLabel={assigneeName(card.assigneeUserId)}
            onOpen={() => onOpenCard(card)}
          />
        ))}
      </SortableContext>
      <Input placeholder="New card" value={cardTitle} onChange={(e) => setCardTitle(e.target.value)} />
      <Button size="sm" disabled={cardTitle.trim() === ''} onClick={() => void addCard()}>
        Add card
      </Button>
    </Stack>
  );
}
