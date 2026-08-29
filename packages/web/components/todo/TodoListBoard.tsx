'use client';

import {Box, Button, HStack, Stack, Switch} from '@chakra-ui/react';
import {DndContext, PointerSensor, closestCorners, useSensor, useSensors, type DragEndEvent} from '@dnd-kit/core';
import {arrayMove, horizontalListSortingStrategy, SortableContext} from '@dnd-kit/sortable';
import {useCallback, useEffect, useState} from 'react';
import {AddIcon} from '@so/component';
import {TODO_ARCHIVE_COLUMN_ID, canManageTodoColumns, type PodRole} from '@so/model';
import type {DbTodoColumn} from '@/lib/api/db/listDbTodoColumns';
import listDbTodoColumns from '@/lib/api/db/listDbTodoColumns';
import type {DbTodoCard} from '@/lib/api/db/mapDbTodoCard';
import listDbTodoCards from '@/lib/api/db/listDbTodoCards';
import moveDbTodoCard from '@/lib/api/db/moveDbTodoCard';
import reorderDbTodoColumns from '@/lib/api/db/reorderDbTodoColumns';
import type {DbPodMember} from '@/lib/api/db/listDbPodMembers';
import TodoListBoardColumn from '@/components/todo/TodoListBoardColumn';
import TodoListBoardArchivePanel from '@/components/todo/TodoListBoardArchivePanel';
import TodoListAddColumnDialog from '@/components/todo/TodoListAddColumnDialog';
import TodoListCardDialog from '@/components/todo/TodoListCardDialog';

export interface TodoListBoardProps {
  readonly podId: string;
  readonly userId: string;
  readonly members: readonly DbPodMember[];
  readonly podRole: PodRole | undefined;
  readonly isSpaceOwner: boolean;
}

function destColumnId(overId: string, columns: readonly DbTodoColumn[], cards: readonly DbTodoCard[]): string | undefined {
  if (overId === TODO_ARCHIVE_COLUMN_ID) {
    return undefined;
  }
  if (columns.some((c) => c.id === overId)) {
    return overId;
  }
  return cards.find((c) => c.id === overId)?.columnId;
}

export default function TodoListBoard({podId, userId, members, podRole, isSpaceOwner}: TodoListBoardProps) {
  const [columns, setColumns] = useState<readonly DbTodoColumn[]>([]);
  const [cards, setCards] = useState<readonly DbTodoCard[]>([]);
  const [openCard, setOpenCard] = useState<DbTodoCard | undefined>(undefined);
  const [addOpen, setAddOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 8}}));
  const manageCols = canManageTodoColumns(podRole, isSpaceOwner);

  const load = useCallback(async (): Promise<void> => {
    const [colRows, cardRows] = await Promise.all([listDbTodoColumns(podId), listDbTodoCards(podId)]);
    setColumns(colRows);
    setCards(cardRows);
  }, [podId]);

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, [load]);

  const assigneeName = (id: string | undefined): string | undefined => {
    if (id === undefined) {
      return undefined;
    }
    return members.find((m) => m.userId === id)?.username ?? id.slice(0, 8);
  };

  const onDragEnd = async (event: DragEndEvent): Promise<void> => {
    const overId = event.over?.id;
    if (overId === undefined) {
      return;
    }
    if (event.active.data.current?.type === 'column') {
      const from = columns.findIndex((c) => c.id === String(event.active.id));
      const overColumnId = destColumnId(String(overId), columns, cards);
      const to = columns.findIndex((c) => c.id === overColumnId);
      if (from < 0 || to < 0 || from === to) {
        return;
      }
      const ids = arrayMove([...columns.map((c) => c.id)], from, to);
      setColumns(arrayMove([...columns], from, to));
      await reorderDbTodoColumns(ids);
      await load();
      return;
    }
    const cardId = String(event.active.id);
    const dest = destColumnId(String(overId), columns, cards);
    const inDest = cards.filter((c) => c.id !== cardId && c.columnId === dest);
    const overIndex = inDest.findIndex((c) => c.id === String(overId));
    const sortOrder = overIndex >= 0 ? overIndex : inDest.length;
    await moveDbTodoCard(cardId, dest, sortOrder);
    await load();
  };

  const archived = cards.filter((c) => c.columnId === undefined);

  return (
    <Stack gap={4}>
      <HStack justify="space-between" flexWrap="wrap" gap={3}>
        {manageCols ? (
          <Button size="sm" colorPalette="brand" onClick={() => setAddOpen(true)}>
            <AddIcon size={16} />
            Add column
          </Button>
        ) : (
          <Box />
        )}
        <Switch.Root checked={showArchived} onCheckedChange={(e) => setShowArchived(e.checked)}>
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>Show archived</Switch.Label>
        </Switch.Root>
      </HStack>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={(e) => void onDragEnd(e)}>
        <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
          <HStack align="start" overflowX="auto" gap={3}>
            {columns.map((column) => (
              <TodoListBoardColumn
                key={column.id}
                column={column}
                cards={cards.filter((c) => c.columnId === column.id)}
                canManageColumns={manageCols}
                userId={userId}
                assigneeName={assigneeName}
                onOpenCard={setOpenCard}
                onChanged={() => void load()}
              />
            ))}
            {showArchived ? (
              <TodoListBoardArchivePanel cards={archived} assigneeName={assigneeName} onOpenCard={setOpenCard} />
            ) : null}
          </HStack>
        </SortableContext>
      </DndContext>
      {manageCols ? (
        <TodoListAddColumnDialog
          open={addOpen}
          podId={podId}
          nextSortOrder={columns.length}
          onClose={() => setAddOpen(false)}
          onAdded={() => void load()}
        />
      ) : null}
      <TodoListCardDialog
        open={openCard !== undefined}
        card={openCard}
        members={members}
        userId={userId}
        podRole={podRole}
        isSpaceOwner={isSpaceOwner}
        onClose={() => setOpenCard(undefined)}
        onChanged={() => void load()}
      />
    </Stack>
  );
}
