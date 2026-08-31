'use client';

import {Box, Button, HStack, Text} from '@chakra-ui/react';
import {TagsIcon} from '@so/component';

export interface TodoListBoardTagFilterProps {
  readonly tags: readonly string[];
  readonly selected: readonly string[];
  readonly onToggle: (tag: string) => void;
  readonly onClear: () => void;
}

export default function TodoListBoardTagFilter({tags, selected, onToggle, onClear}: TodoListBoardTagFilterProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <HStack gap={2} flexWrap="wrap" align="center">
      <HStack gap={1} color="fg.muted">
        <TagsIcon size={14} />
        <Text fontSize="sm">Tags</Text>
      </HStack>
      {tags.map((tag) => {
        const active = selected.includes(tag);
        return (
          <Button
            key={tag}
            size="xs"
            variant={active ? 'solid' : 'outline'}
            onClick={() => onToggle(tag)}
          >
            {tag}
          </Button>
        );
      })}
      {selected.length > 0 ? (
        <Box>
          <Button size="xs" variant="ghost" onClick={onClear}>
            Clear
          </Button>
        </Box>
      ) : null}
    </HStack>
  );
}
