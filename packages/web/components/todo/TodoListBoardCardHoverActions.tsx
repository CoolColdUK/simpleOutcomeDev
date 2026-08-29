'use client';

import {HStack, IconButton} from '@chakra-ui/react';
import {Box, Circle} from '@chakra-ui/react';
import {ArchiveIcon, DeleteIcon, TickIcon} from '@so/component';

export interface TodoListBoardCardHoverActionsProps {
  readonly complete: boolean;
  readonly onComplete: () => void;
  readonly onArchive: () => void;
  readonly onDelete: () => void;
}

export default function TodoListBoardCardHoverActions({
  complete,
  onComplete,
  onArchive,
  onDelete,
}: TodoListBoardCardHoverActionsProps) {
  const stop = (e: {stopPropagation: () => void}): void => {
    e.stopPropagation();
  };

  return (
    <HStack
      gap={1}
      position="absolute"
      top={1}
      left={1}
      zIndex={1}
      onClick={stop}
      onPointerDown={stop}
    >
      <Box
        className={complete ? undefined : 'todo-card-hover'}
        as="button"
        type="button"
        aria-label={complete ? 'Mark incomplete' : 'Mark complete'}
        onClick={onComplete}
      >
        <Circle
          size="22px"
          borderWidth="2px"
          borderColor={complete ? 'green.500' : 'border.emphasized'}
          bg={complete ? 'green.500' : 'bg.paper'}
          color="white"
        >
          {complete ? <TickIcon size={14} /> : null}
        </Circle>
      </Box>
      <HStack className="todo-card-hover" gap={0}>
        <IconButton aria-label="Archive card" size="xs" variant="ghost" onClick={onArchive}>
          <ArchiveIcon size={14} />
        </IconButton>
        <IconButton aria-label="Delete card" size="xs" variant="ghost" onClick={onDelete}>
          <DeleteIcon size={14} />
        </IconButton>
      </HStack>
    </HStack>
  );
}
