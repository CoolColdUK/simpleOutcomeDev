'use client';

import {Box, Badge, Stack, Text} from '@chakra-ui/react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {GripDotsIcon} from '@so/component';
import {todoCardStatusLabel} from '@so/model';
import type {DbTodoCard} from '@/lib/api/db/mapDbTodoCard';
import TodoListBoardCardHoverActions from '@/components/todo/TodoListBoardCardHoverActions';
import formatTodoDueAt from '@/components/todo/formatTodoDueAt';

export interface TodoListBoardCardProps {
  readonly card: DbTodoCard;
  readonly columnTitle: string | undefined;
  readonly assigneeLabel: string | undefined;
  readonly onOpen: () => void;
  readonly onComplete: () => void;
  readonly onArchive: () => void;
  readonly onDelete: () => void;
}

export default function TodoListBoardCard({
  card,
  columnTitle,
  assigneeLabel,
  onOpen,
  onComplete,
  onArchive,
  onDelete,
}: TodoListBoardCardProps) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
    id: card.id,
    data: {type: 'card', columnId: card.columnId},
  });
  const complete = card.completedAt !== undefined;
  const dueLabel = formatTodoDueAt(card.dueAt);

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: isDragging ? undefined : CSS.Transform.toString(transform),
        transition: isDragging ? undefined : transition,
        opacity: isDragging ? 0 : 1,
      }}
      position="relative"
      borderWidth="1px"
      borderColor="border.emphasized"
      borderRadius="md"
      p={2}
      pt={7}
      bg="bg.paper"
      cursor="pointer"
      onClick={onOpen}
      css={{
        '& .todo-card-hover': {opacity: 0},
        _hover: {'& .todo-card-hover': {opacity: 1}},
      }}
    >
      <TodoListBoardCardHoverActions
        complete={complete}
        onComplete={onComplete}
        onArchive={onArchive}
        onDelete={onDelete}
      />
      <Stack gap={1}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
          <Text fontWeight="semibold" textDecoration={complete ? 'line-through' : undefined}>
            {card.title}
          </Text>
          <Box
            {...attributes}
            {...listeners}
            cursor="grab"
            color="fg.muted"
            onClick={(e) => e.stopPropagation()}
            aria-label="Drag card"
          >
            <GripDotsIcon size={14} />
          </Box>
        </Box>
        <Text fontSize="xs" color="fg.muted">
          {todoCardStatusLabel(columnTitle)}
        </Text>
        {dueLabel !== undefined ? <Text fontSize="xs">{dueLabel}</Text> : null}
        {assigneeLabel !== undefined ? <Text fontSize="xs">{assigneeLabel}</Text> : null}
        {card.tags.length > 0 ? (
          <Box display="flex" gap={1} flexWrap="wrap">
            {card.tags.map((tag) => (
              <Badge key={tag} size="sm" variant="subtle">
                {tag}
              </Badge>
            ))}
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
}
