'use client';

import {Box, IconButton, Menu, Portal} from '@chakra-ui/react';
import {ArchiveIcon, DeleteIcon, MoreVertIcon, TickIcon} from '@so/component';
import AppIconTooltip from '@/components/app/AppIconTooltip';
import archiveDbTodoCardsByColumn from '@/lib/api/db/archiveDbTodoCardsByColumn';
import archiveDbTodoCardsCompletedByColumn from '@/lib/api/db/archiveDbTodoCardsCompletedByColumn';
import deleteDbTodoColumn from '@/lib/api/db/deleteDbTodoColumn';

export interface TodoListBoardColumnMenuProps {
  readonly columnId: string;
  readonly canManageColumns: boolean;
  readonly onChanged: () => void;
}

export default function TodoListBoardColumnMenu({columnId, canManageColumns, onChanged}: TodoListBoardColumnMenuProps) {
  return (
    <Menu.Root positioning={{placement: 'bottom-end'}}>
      <Menu.Trigger asChild>
        <Box display="inline-flex">
          <AppIconTooltip label="Column actions">
            <IconButton aria-label="Column actions" size="xs" variant="ghost">
              <MoreVertIcon size={16} />
            </IconButton>
          </AppIconTooltip>
        </Box>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item value="archive-all" onClick={() => void archiveDbTodoCardsByColumn(columnId).then(onChanged)}>
              <ArchiveIcon size={16} />
              Archive all cards
            </Menu.Item>
            <Menu.Item
              value="archive-completed"
              onClick={() => void archiveDbTodoCardsCompletedByColumn(columnId).then(onChanged)}
            >
              <TickIcon size={16} />
              Archive all completed cards
            </Menu.Item>
            {canManageColumns ? (
              <Menu.Item value="delete" onClick={() => void deleteDbTodoColumn(columnId).then(onChanged)}>
                <DeleteIcon size={16} />
                Delete column
              </Menu.Item>
            ) : null}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
