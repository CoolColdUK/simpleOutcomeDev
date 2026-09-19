'use client';

import {Button, HStack, Stack, Switch} from '@chakra-ui/react';
import {AddIcon} from '@so/component';
import TodoListBoardTagFilter from '@/components/todo/TodoListBoardTagFilter';

export interface TodoListBoardToolbarProps {
  readonly canManageColumns: boolean;
  readonly availableTags: readonly string[];
  readonly selectedTags: readonly string[];
  readonly singleList: boolean;
  readonly showArchived: boolean;
  readonly onAddColumn: () => void;
  readonly onToggleTag: (tag: string) => void;
  readonly onClearTags: () => void;
  readonly onSingleListChange: (enabled: boolean) => void;
  readonly onShowArchivedChange: (enabled: boolean) => void;
}

export default function TodoListBoardToolbar({
  canManageColumns,
  availableTags,
  selectedTags,
  singleList,
  showArchived,
  onAddColumn,
  onToggleTag,
  onClearTags,
  onSingleListChange,
  onShowArchivedChange,
}: TodoListBoardToolbarProps) {
  return (
    <Stack className="no-print" gap={3}>
      <HStack justify="space-between" flexWrap="wrap" gap={3}>
        <HStack gap={2} flexWrap="wrap">
          {canManageColumns ? (
            <Button size="sm" colorPalette="brand" onClick={onAddColumn}>
              <AddIcon size={16} />
              Add column
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            Print
          </Button>
        </HStack>
        <HStack gap={4} flexWrap="wrap">
          <Switch.Root checked={singleList} onCheckedChange={(e) => onSingleListChange(e.checked)}>
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Label>Single list</Switch.Label>
          </Switch.Root>
          <Switch.Root checked={showArchived} onCheckedChange={(e) => onShowArchivedChange(e.checked)}>
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Label>Show archived</Switch.Label>
          </Switch.Root>
        </HStack>
      </HStack>
      <TodoListBoardTagFilter
        tags={availableTags}
        selected={selectedTags}
        onToggle={onToggleTag}
        onClear={onClearTags}
      />
    </Stack>
  );
}
