'use client';

import {HStack, Stack} from '@chakra-ui/react';
import {DndContext, PointerSensor, closestCorners, useSensor, useSensors, type DragEndEvent} from '@dnd-kit/core';
import {useCallback, useEffect, useState} from 'react';
import {TODO_ARCHIVE_COLUMN_ID, canManageTodoColumns, type PodRole} from '@so/model';
import type {DbTodoColumn} from '@/lib/api/db/listDbTodoColumns';
import listDbTodoColumns from '@/lib/api/db/listDbTodoColumns';
import type {DbTodoCard} from '@/lib/api/db/mapDbTodoCard';
import listDbTodoCards from '@/lib/api/db/listDbTodoCards';
import moveDbTodoCard from '@/lib/api/db/moveDbTodoCard';
import type {DbPodMember} from '@/lib/api/db/listDbPodMembers';
import TodoListBoardColumn from '@/components/todo/TodoListBoardColumn';
import TodoListBoardArchivePanel from '@/components/todo/TodoListBoardArchivePanel';
import TodoListAddColumn from '@/components/todo/TodoListAddColumn';
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
  const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 8}}));
  const manageCols = canManageTodoColumns(podRole, isSpaceOwner);

  const load = useCallback(async (): Promise<void> => {
    const [colRows, cardRows] = await Promise.all([listDbTodoColumns(podId), listDbTodoCards(podId)]);
    setColumns(colRows);
    setCards(cardRows);
  }, [podId]);

  useEffect(() => {
    void load();
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
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={(e) => void onDragEnd(e)}>
        <HStack align="start" overflowX="auto" gap={3}>
          {columns.map((column) => (
            <TodoListBoardColumn
              key={column.id}
              column={column}
              columnIds={columns.map((c) => c.id)}
              cards={cards.filter((c) => c.columnId === column.id)}
              canManageColumns={manageCols}
              userId={userId}
              assigneeName={assigneeName}
              onOpenCard={setOpenCard}
              onChanged={() => void load()}
            />
          ))}
          {manageCols ? (
            <TodoListAddColumn podId={podId} nextSortOrder={columns.length} onAdded={() => void load()} />
          ) : null}
          <TodoListBoardArchivePanel cards={archived} assigneeName={assigneeName} onOpenCard={setOpenCard} />
        </HStack>
      </DndContext>
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
