'use client';

import {IconButton, Menu, Portal} from '@chakra-ui/react';
import {ArchiveIcon, DeleteIcon, MoreVertIcon} from '@so/component';
import AppIconTooltip from '@/components/app/AppIconTooltip';
import archiveDbTodoCardsByColumn from '@/lib/api/db/archiveDbTodoCardsByColumn';
import deleteDbTodoColumn from '@/lib/api/db/deleteDbTodoColumn';

export interface TodoListBoardColumnMenuProps {
  readonly columnId: string;
  readonly canManageColumns: boolean;
  readonly onChanged: () => void;
}

export default function TodoListBoardColumnMenu({columnId, canManageColumns, onChanged}: TodoListBoardColumnMenuProps) {
  return (
    <Menu.Root>
      <AppIconTooltip label="Column actions">
        <Menu.Trigger asChild>
          <IconButton aria-label="Column actions" size="xs" variant="ghost">
            <MoreVertIcon size={16} />
          </IconButton>
        </Menu.Trigger>
      </AppIconTooltip>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item value="archive-all" onClick={() => void archiveDbTodoCardsByColumn(columnId).then(onChanged)}>
              <ArchiveIcon size={16} />
              Archive all cards
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
