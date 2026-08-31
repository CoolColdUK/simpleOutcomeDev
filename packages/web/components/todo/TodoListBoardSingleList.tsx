'use client';

import {Box, HStack, Stack} from '@chakra-ui/react';
import {SortableContext, rectSortingStrategy} from '@dnd-kit/sortable';
import {TODO_ARCHIVE_COLUMN_ID} from '@so/model';
import type {DbTodoColumn} from '@/lib/api/db/listDbTodoColumns';
import type {DbTodoCard} from '@/lib/api/db/mapDbTodoCard';
import TodoListBoardCard from '@/components/todo/TodoListBoardCard';
import TodoListBoardStatusChip from '@/components/todo/TodoListBoardStatusChip';
import TodoListBoardSingleListAdd from '@/components/todo/TodoListBoardSingleListAdd';

export interface TodoListBoardSingleListProps {
  readonly podId: string;
  readonly userId: string;
  readonly columns: readonly DbTodoColumn[];
  readonly cards: readonly DbTodoCard[];
  readonly cardCountByColumn: Readonly<Record<string, number>>;
  readonly showArchived: boolean;
  readonly canManageColumns: boolean;
  readonly assigneeName: (userId: string | undefined) => string | undefined;
  readonly onOpenCard: (card: DbTodoCard) => void;
  readonly onCompleteCard: (card: DbTodoCard) => void;
  readonly onArchiveCard: (card: DbTodoCard) => void;
  readonly onDeleteCard: (card: DbTodoCard) => void;
  readonly onChanged: () => void;
}

export default function TodoListBoardSingleList({
  podId,
  userId,
  columns,
  cards,
  cardCountByColumn,
  showArchived,
  canManageColumns,
  assigneeName,
  onOpenCard,
  onCompleteCard,
  onArchiveCard,
  onDeleteCard,
  onChanged,
}: TodoListBoardSingleListProps) {
  const titleById = new Map(columns.map((column) => [column.id, column.title]));

  return (
    <Stack gap={3}>
      <HStack gap={2} flexWrap="wrap">
        {columns.map((column) => (
          <TodoListBoardStatusChip
            key={column.id}
            columnId={column.id}
            title={column.title}
            canManageColumns={canManageColumns}
            showMenu
            onChanged={onChanged}
          />
        ))}
        {showArchived ? (
          <TodoListBoardStatusChip
            columnId={TODO_ARCHIVE_COLUMN_ID}
            title={undefined}
            canManageColumns={false}
            showMenu={false}
            onChanged={onChanged}
          />
        ) : null}
      </HStack>
      <TodoListBoardSingleListAdd
        podId={podId}
        userId={userId}
        columns={columns}
        cardCountByColumn={cardCountByColumn}
        onChanged={onChanged}
      />
      <SortableContext items={cards.map((card) => card.id)} strategy={rectSortingStrategy}>
        <Box
          display="grid"
          gridTemplateColumns={{base: '1fr', sm: 'repeat(auto-fill, minmax(240px, 1fr))'}}
          gap={3}
        >
          {cards.map((card) => (
            <TodoListBoardCard
              key={card.id}
              card={card}
              columnTitle={card.columnId === undefined ? undefined : titleById.get(card.columnId)}
              assigneeLabel={assigneeName(card.assigneeUserId)}
              statusAsTag
              onOpen={() => onOpenCard(card)}
              onComplete={() => onCompleteCard(card)}
              onArchive={() => onArchiveCard(card)}
              onDelete={() => onDeleteCard(card)}
            />
          ))}
        </Box>
      </SortableContext>
    </Stack>
  );
}
