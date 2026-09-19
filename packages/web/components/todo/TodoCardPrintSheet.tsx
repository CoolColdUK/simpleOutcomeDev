'use client';

import {createPortal} from 'react-dom';
import {Badge, Box, Heading, HStack, Stack, Text} from '@chakra-ui/react';
import TodoMarkdownBody from '@/components/todo/TodoMarkdownBody';

export interface TodoCardPrintSheetProps {
  readonly title: string;
  readonly description: string;
  readonly dueLabel: string | undefined;
  readonly assigneeLabel: string | undefined;
  readonly tags: readonly string[];
}

function DescriptionBlock({description}: {readonly description: string}) {
  if (description.trim() === '') {
    return (
      <Text fontSize="sm" color="fg.muted">
        No description
      </Text>
    );
  }
  return <TodoMarkdownBody markdown={description} />;
}

export default function TodoCardPrintSheet({
  title,
  description,
  dueLabel,
  assigneeLabel,
  tags,
}: TodoCardPrintSheetProps) {
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <>
      <Box className="todo-print-root todo-print-root--card" aria-hidden>
        <Stack gap={3}>
          <Heading as="h1" size="lg">
            {title.trim() === '' ? 'Untitled card' : title}
          </Heading>
          {dueLabel !== undefined ? <Text fontSize="sm">Due {dueLabel}</Text> : null}
          {assigneeLabel !== undefined ? <Text fontSize="sm">Assignee {assigneeLabel}</Text> : null}
          {tags.length > 0 ? (
            <HStack gap={1} flexWrap="wrap">
              {tags.map((tag) => (
                <Badge key={tag} size="sm" variant="subtle">
                  {tag}
                </Badge>
              ))}
            </HStack>
          ) : null}
          <Box>
            <DescriptionBlock description={description} />
          </Box>
        </Stack>
      </Box>
      <Box className="todo-print-root todo-print-root--description" aria-hidden>
        <DescriptionBlock description={description} />
      </Box>
    </>,
    document.body,
  );
}
