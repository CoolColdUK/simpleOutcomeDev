'use client';

import {Badge, Box, HStack, Stack, Text} from '@chakra-ui/react';
import {todoCardStatusLabel} from '@so/model';
import type {DbTodoCard} from '@/lib/api/db/mapDbTodoCard';
import formatTodoDueAt from '@/components/todo/formatTodoDueAt';
import TodoCardIconThumb from '@/components/todo/TodoCardIconThumb';

export interface TodoListBoardCardPreviewProps {
  readonly card: DbTodoCard;
  readonly columnTitle: string | undefined;
  readonly assigneeLabel: string | undefined;
  readonly iconUrl: string | undefined;
}

export default function TodoListBoardCardPreview({
  card,
  columnTitle,
  assigneeLabel,
  iconUrl,
}: TodoListBoardCardPreviewProps) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border.emphasized"
      borderRadius="md"
      p={2}
      bg="bg.paper"
      boxShadow="md"
      minW="240px"
    >
      <HStack align="start" gap={2}>
        <TodoCardIconThumb src={iconUrl} />
        <Stack gap={1} flex="1" minW={0}>
        <Text fontWeight="semibold" textDecoration={card.completedAt !== undefined ? 'line-through' : undefined}>
          {card.title}
        </Text>
        <Text fontSize="xs" color="fg.muted">
          {todoCardStatusLabel(columnTitle)}
        </Text>
        {formatTodoDueAt(card.dueAt) !== undefined ? <Text fontSize="xs">{formatTodoDueAt(card.dueAt)}</Text> : null}
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
      </HStack>
    </Box>
  );
}
