'use client';

import {Button, Heading, HStack, Input, Stack} from '@chakra-ui/react';
import {useDroppable} from '@dnd-kit/core';
import {SortableContext, useSortable, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {useState} from 'react';
import {GripDotsIcon} from '@so/component';
import type {DbTodoColumn} from '@/lib/api/db/listDbTodoColumns';
import type {DbTodoCard} from '@/lib/api/db/mapDbTodoCard';
import TodoListBoardCard from '@/components/todo/TodoListBoardCard';
import TodoListBoardColumnMenu from '@/components/todo/TodoListBoardColumnMenu';
import AppIconTooltip from '@/components/app/AppIconTooltip';
import updateDbTodoColumn from '@/lib/api/db/updateDbTodoColumn';
import createDbTodoCard from '@/lib/api/db/createDbTodoCard';

export interface TodoListBoardColumnProps {
  readonly column: DbTodoColumn;
  readonly cards: readonly DbTodoCard[];
  readonly canManageColumns: boolean;
  readonly sortDisabled: boolean;
  readonly userId: string;
  readonly assigneeName: (userId: string | undefined) => string | undefined;
  readonly onOpenCard: (card: DbTodoCard) => void;
  readonly onCompleteCard: (card: DbTodoCard) => void;
  readonly onArchiveCard: (card: DbTodoCard) => void;
  readonly onDeleteCard: (card: DbTodoCard) => void;
  readonly onChanged: () => void;
}

export default function TodoListBoardColumn({
  column,
  cards,
  canManageColumns,
  sortDisabled,
  userId,
  assigneeName,
  onOpenCard,
  onCompleteCard,
  onArchiveCard,
  onDeleteCard,
  onChanged,
}: TodoListBoardColumnProps) {
  const {setNodeRef: setDropRef} = useDroppable({id: column.id});
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
    id: column.id,
    data: {type: 'column'},
    disabled: !canManageColumns || sortDisabled,
  });
  const [title, setTitle] = useState(column.title);
  const [cardTitle, setCardTitle] = useState('');

  const saveTitle = async (): Promise<void> => {
    await updateDbTodoColumn(column.id, title);
    onChanged();
  };

  const addCard = async (): Promise<void> => {
    await createDbTodoCard(column.podId, column.id, cardTitle, userId, cards.length);
    setCardTitle('');
    onChanged();
  };

  return (
    <Stack
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? undefined : transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      minW="260px"
      maxW="280px"
      gap={2}
      p={2}
      borderWidth="1px"
      borderRadius="md"
      bg="bg.subtle"
    >
      <HStack gap={1} align="center">
        {canManageColumns ? (
          <AppIconTooltip label="Move column">
            <Stack
              {...attributes}
              {...listeners}
              cursor="grab"
              color="fg.muted"
              aria-label="Move column"
              py={1}
              style={{touchAction: 'none'}}
            >
              <GripDotsIcon size={14} />
            </Stack>
          </AppIconTooltip>
        ) : null}
        {canManageColumns ? (
          <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => void saveTitle()} />
        ) : (
          <Heading as="h3" size="sm" flex="1">
            {column.title}
          </Heading>
        )}
        <TodoListBoardColumnMenu columnId={column.id} canManageColumns={canManageColumns} onChanged={onChanged} />
      </HStack>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {cards.map((card) => (
          <TodoListBoardCard
            key={card.id}
            card={card}
            columnTitle={column.title}
            assigneeLabel={assigneeName(card.assigneeUserId)}
            onOpen={() => onOpenCard(card)}
            onComplete={() => onCompleteCard(card)}
            onArchive={() => onArchiveCard(card)}
            onDelete={() => onDeleteCard(card)}
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
