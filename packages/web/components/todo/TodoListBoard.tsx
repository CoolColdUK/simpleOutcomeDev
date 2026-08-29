'use client';

import {Box, Button, HStack, Stack, Switch} from '@chakra-ui/react';
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {arrayMove, horizontalListSortingStrategy, SortableContext} from '@dnd-kit/sortable';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AddIcon} from '@so/component';
import {applyTodoCardDrag, canManageTodoColumns, type PodRole} from '@so/model';
import type {DbTodoColumn} from '@/lib/api/db/listDbTodoColumns';
import listDbTodoColumns from '@/lib/api/db/listDbTodoColumns';
import type {DbTodoCard} from '@/lib/api/db/mapDbTodoCard';
import listDbTodoCards from '@/lib/api/db/listDbTodoCards';
import moveDbTodoCard from '@/lib/api/db/moveDbTodoCard';
import reorderDbTodoColumns from '@/lib/api/db/reorderDbTodoColumns';
import reorderDbTodoCards from '@/lib/api/db/reorderDbTodoCards';
import updateDbTodoCard from '@/lib/api/db/updateDbTodoCard';
import deleteDbTodoCard from '@/lib/api/db/deleteDbTodoCard';
import type {DbPodMember} from '@/lib/api/db/listDbPodMembers';
import TodoListBoardColumn from '@/components/todo/TodoListBoardColumn';
import TodoListBoardArchivePanel from '@/components/todo/TodoListBoardArchivePanel';
import TodoListAddColumnDialog from '@/components/todo/TodoListAddColumnDialog';
import TodoListCardDialog from '@/components/todo/TodoListCardDialog';
import TodoListBoardCardPreview from '@/components/todo/TodoListBoardCardPreview';
import destTodoColumnId from '@/components/todo/destTodoColumnId';
import createTodoBoardCollisionDetection from '@/components/todo/createTodoBoardCollisionDetection';
import mergeTodoCardSort from '@/components/todo/mergeTodoCardSort';

export interface TodoListBoardProps {
  readonly podId: string;
  readonly userId: string;
  readonly members: readonly DbPodMember[];
  readonly podRole: PodRole | undefined;
  readonly isSpaceOwner: boolean;
}

export default function TodoListBoard({podId, userId, members, podRole, isSpaceOwner}: TodoListBoardProps) {
  const [columns, setColumns] = useState<readonly DbTodoColumn[]>([]);
  const [cards, setCards] = useState<readonly DbTodoCard[]>([]);
  const [openCard, setOpenCard] = useState<DbTodoCard | undefined>(undefined);
  const [addOpen, setAddOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [dragType, setDragType] = useState<string | undefined>(undefined);
  const [activeCardId, setActiveCardId] = useState<string | undefined>(undefined);
  const cardsBeforeDrag = useRef<readonly DbTodoCard[]>([]);
  const cardsRef = useRef(cards);
  const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 8}}));
  const manageCols = canManageTodoColumns(podRole, isSpaceOwner);
  const columnIds = columns.map((c) => c.id);
  const collisionDetection = useMemo(
    () => createTodoBoardCollisionDetection(() => dragType, () => columnIds),
    [columnIds, dragType],
  );

  const load = useCallback(async (): Promise<void> => {
    const [colRows, cardRows] = await Promise.all([listDbTodoColumns(podId), listDbTodoCards(podId)]);
    setColumns(colRows);
    setCards(cardRows);
    setOpenCard((current) => {
      if (current === undefined) {
        return undefined;
      }
      return cardRows.find((row) => row.id === current.id) ?? current;
    });
  }, [podId]);

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, [load]);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  const assigneeName = (id: string | undefined): string | undefined => {
    if (id === undefined) {
      return undefined;
    }
    return members.find((m) => m.userId === id)?.username ?? id.slice(0, 8);
  };

  const onDragStart = (event: DragStartEvent): void => {
    const type = event.active.data.current?.type;
    setDragType(typeof type === 'string' ? type : undefined);
    if (type === 'card') {
      setActiveCardId(String(event.active.id));
      cardsBeforeDrag.current = cards;
    }
  };

  const onDragOver = (event: DragOverEvent): void => {
    const overId = event.over?.id;
    if (overId === undefined || event.active.data.current?.type !== 'card') {
      return;
    }
    const cardId = String(event.active.id);
    setCards((prev) => {
      const next = applyTodoCardDrag({
        cards: prev,
        activeId: cardId,
        overId: String(overId),
        columnIds,
      });
      if (next === undefined) {
        return prev;
      }
      return mergeTodoCardSort(prev, next);
    });
  };

  const onDragCancel = (): void => {
    if (dragType === 'card') {
      setCards(cardsBeforeDrag.current);
    }
    setDragType(undefined);
    setActiveCardId(undefined);
  };

  const onDragEnd = async (event: DragEndEvent): Promise<void> => {
    const overId = event.over?.id;
    const type = dragType;
    setDragType(undefined);
    setActiveCardId(undefined);
    if (overId === undefined) {
      if (type === 'card') {
        setCards(cardsBeforeDrag.current);
      }
      return;
    }
    if (type === 'column') {
      const from = columns.findIndex((c) => c.id === String(event.active.id));
      const overColumnId = destTodoColumnId(String(overId), columns, cards);
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
    const latest = cardsRef.current;
    const nextItems = applyTodoCardDrag({
      cards: latest,
      activeId: cardId,
      overId: String(overId),
      columnIds,
    });
    const ordered = nextItems === undefined ? latest : mergeTodoCardSort(latest, nextItems);
    setCards(ordered);
    await reorderDbTodoCards(
      ordered.map((c) => ({id: c.id, columnId: c.columnId, sortOrder: c.sortOrder})),
    );
    await load();
  };

  const archived = cards.filter((c) => c.columnId === undefined);
  const activeCard = cards.find((c) => c.id === activeCardId);
  const activeColumnTitle = columns.find((c) => c.id === activeCard?.columnId)?.title;

  const completeCard = async (card: DbTodoCard): Promise<void> => {
    await updateDbTodoCard(card.id, {completedAt: card.completedAt === undefined ? new Date().toISOString() : ''});
    await load();
  };

  const archiveCard = async (card: DbTodoCard): Promise<void> => {
    await moveDbTodoCard(card.id, undefined, card.sortOrder);
    await load();
  };

  const deleteCard = async (card: DbTodoCard): Promise<void> => {
    await deleteDbTodoCard(card.id);
    await load();
  };

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
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        measuring={{droppable: {strategy: MeasuringStrategy.Always}}}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragCancel={onDragCancel}
        onDragEnd={(e) => void onDragEnd(e)}
      >
        <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
          <HStack align="start" overflowX="auto" gap={3}>
            {columns.map((column) => (
              <TodoListBoardColumn
                key={column.id}
                column={column}
                cards={cards.filter((c) => c.columnId === column.id)}
                canManageColumns={manageCols}
                sortDisabled={dragType === 'card'}
                userId={userId}
                assigneeName={assigneeName}
                onOpenCard={setOpenCard}
                onCompleteCard={(card) => void completeCard(card)}
                onArchiveCard={(card) => void archiveCard(card)}
                onDeleteCard={(card) => void deleteCard(card)}
                onChanged={() => void load()}
              />
            ))}
            {showArchived ? (
              <TodoListBoardArchivePanel
                cards={archived}
                assigneeName={assigneeName}
                onOpenCard={setOpenCard}
                onCompleteCard={(card) => void completeCard(card)}
                onArchiveCard={(card) => void archiveCard(card)}
                onDeleteCard={(card) => void deleteCard(card)}
              />
            ) : null}
          </HStack>
        </SortableContext>
        <DragOverlay>
          {activeCard !== undefined ? (
            <TodoListBoardCardPreview
              card={activeCard}
              columnTitle={activeColumnTitle}
              assigneeLabel={assigneeName(activeCard.assigneeUserId)}
            />
          ) : null}
        </DragOverlay>
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
