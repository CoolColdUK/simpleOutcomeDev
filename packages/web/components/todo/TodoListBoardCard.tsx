'use client';

import {Badge, Box, Button, Stack, Text} from '@chakra-ui/react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {todoCardStatusLabel} from '@so/model';
import type {DbTodoCard} from '@/lib/api/db/mapDbTodoCard';

export interface TodoListBoardCardProps {
  readonly card: DbTodoCard;
  readonly columnTitle: string | undefined;
  readonly assigneeLabel: string | undefined;
  readonly onOpen: () => void;
}

export default function TodoListBoardCard({card, columnTitle, assigneeLabel, onOpen}: TodoListBoardCardProps) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id: card.id});

  return (
    <Box
      ref={setNodeRef}
      style={{transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1}}
      {...attributes}
      {...listeners}
      borderWidth="1px"
      borderColor="border.emphasized"
      borderRadius="md"
      p={2}
      bg="bg.paper"
      cursor="grab"
    >
      <Stack gap={1}>
        <Text fontWeight="semibold">{card.title}</Text>
        <Text fontSize="xs" color="fg.muted">
          {todoCardStatusLabel(columnTitle)}
        </Text>
        {card.dueAt !== undefined ? (
          <Text fontSize="xs">{card.dueAt}</Text>
        ) : null}
        {assigneeLabel !== undefined ? (
          <Text fontSize="xs">{assigneeLabel}</Text>
        ) : null}
        {card.tags.length > 0 ? (
          <Box display="flex" gap={1} flexWrap="wrap">
            {card.tags.map((tag) => (
              <Badge key={tag} size="sm" variant="subtle">
                {tag}
              </Badge>
            ))}
          </Box>
        ) : null}
        <Button size="xs" variant="ghost" onClick={onOpen} onPointerDown={(e) => e.stopPropagation()}>
          Open
        </Button>
      </Stack>
    </Box>
  );
}
