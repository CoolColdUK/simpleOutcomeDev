'use client';

import {Heading, Stack} from '@chakra-ui/react';
import {useDroppable} from '@dnd-kit/core';
import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {TODO_ARCHIVE_COLUMN_ID} from '@so/model';
import type {DbTodoCard} from '@/lib/api/db/mapDbTodoCard';
import TodoListBoardCard from '@/components/todo/TodoListBoardCard';
import todoCardIconUrl from '@/lib/todo/todoCardIconUrl';

export interface TodoListBoardArchivePanelProps {
  readonly cards: readonly DbTodoCard[];
  readonly assigneeName: (userId: string | undefined) => string | undefined;
  readonly onOpenCard: (card: DbTodoCard) => void;
  readonly onCompleteCard: (card: DbTodoCard) => void;
  readonly onArchiveCard: (card: DbTodoCard) => void;
  readonly onDeleteCard: (card: DbTodoCard) => void;
  readonly iconUrlByPath: Readonly<Record<string, string>>;
}

export default function TodoListBoardArchivePanel({
  cards,
  assigneeName,
  onOpenCard,
  onCompleteCard,
  onArchiveCard,
  onDeleteCard,
  iconUrlByPath,
}: TodoListBoardArchivePanelProps) {
  const {setNodeRef} = useDroppable({id: TODO_ARCHIVE_COLUMN_ID});

  return (
    <Stack ref={setNodeRef} minW="260px" maxW="280px" gap={2} p={2} borderWidth="1px" borderRadius="md" bg="bg.muted">
      <Heading as="h3" size="sm">
        Archive
      </Heading>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {cards.map((card) => (
          <TodoListBoardCard
            key={card.id}
            card={card}
            columnTitle={undefined}
            assigneeLabel={assigneeName(card.assigneeUserId)}
            iconUrl={todoCardIconUrl(card.iconPath, iconUrlByPath)}
            onOpen={() => onOpenCard(card)}
            onComplete={() => onCompleteCard(card)}
            onArchive={() => onArchiveCard(card)}
            onDelete={() => onDeleteCard(card)}
          />
        ))}
      </SortableContext>
    </Stack>
  );
}
