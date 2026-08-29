'use client';

import {Badge, Box, Stack, Text} from '@chakra-ui/react';
import {todoCardStatusLabel} from '@so/model';
import type {DbTodoCard} from '@/lib/api/db/mapDbTodoCard';

export interface TodoListBoardCardPreviewProps {
  readonly card: DbTodoCard;
  readonly columnTitle: string | undefined;
  readonly assigneeLabel: string | undefined;
}

export default function TodoListBoardCardPreview({card, columnTitle, assigneeLabel}: TodoListBoardCardPreviewProps) {
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
      <Stack gap={1}>
        <Text fontWeight="semibold">{card.title}</Text>
        <Text fontSize="xs" color="fg.muted">
          {todoCardStatusLabel(columnTitle)}
        </Text>
        {card.dueAt !== undefined ? <Text fontSize="xs">{card.dueAt}</Text> : null}
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
