'use client';

import {Badge, Box, HStack} from '@chakra-ui/react';
import {useDroppable} from '@dnd-kit/core';
import {TODO_ARCHIVE_COLUMN_ID, todoCardStatusLabel} from '@so/model';
import TodoListBoardColumnMenu from '@/components/todo/TodoListBoardColumnMenu';

export interface TodoListBoardStatusChipProps {
  readonly columnId: string;
  readonly title: string | undefined;
  readonly canManageColumns: boolean;
  readonly showMenu: boolean;
  readonly onChanged: () => void;
}

export default function TodoListBoardStatusChip({
  columnId,
  title,
  canManageColumns,
  showMenu,
  onChanged,
}: TodoListBoardStatusChipProps) {
  const {setNodeRef, isOver} = useDroppable({id: columnId});

  return (
    <HStack
      ref={setNodeRef}
      gap={0}
      borderWidth="1px"
      borderRadius="md"
      borderColor={isOver ? 'colorPalette.solid' : 'border'}
      colorPalette="brand"
      bg={isOver ? 'colorPalette.subtle' : 'bg.subtle'}
      pl={2}
      pr={showMenu ? 0 : 2}
      py={0.5}
    >
      <Badge variant="subtle" size="sm">
        {todoCardStatusLabel(title)}
      </Badge>
      {showMenu && columnId !== TODO_ARCHIVE_COLUMN_ID ? (
        <Box>
          <TodoListBoardColumnMenu
            columnId={columnId}
            canManageColumns={canManageColumns}
            onChanged={onChanged}
          />
        </Box>
      ) : null}
    </HStack>
  );
}
