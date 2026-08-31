'use client';

import {HStack, Stack} from '@chakra-ui/react';
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {arrayMove, horizontalListSortingStrategy, SortableContext} from '@dnd-kit/sortable';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  applyTodoCardDrag,
  canManageTodoColumns,
  filterTodoCardsByTags,
  listUniqueTodoCardTags,
  sortTodoCardsByColumnOrder,
  type PodRole,
} from '@so/model';
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
import TodoListBoardToolbar from '@/components/todo/TodoListBoardToolbar';
import TodoListBoardSingleList from '@/components/todo/TodoListBoardSingleList';
import destTodoColumnId from '@/components/todo/destTodoColumnId';
import createTodoBoardCollisionDetection from '@/components/todo/createTodoBoardCollisionDetection';
import mergeTodoCardSort from '@/components/todo/mergeTodoCardSort';
import useTodoPodSingleListMode from '@/lib/todo/useTodoPodSingleListMode';

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
  const [tagFilter, setTagFilter] = useState<readonly string[]>([]);
  const [dragType, setDragType] = useState<string | undefined>(undefined);
  const [activeCardId, setActiveCardId] = useState<string | undefined>(undefined);
  const {enabled: singleList, setEnabled: setSingleList} = useTodoPodSingleListMode(podId);
  const cardsBeforeDrag = useRef<readonly DbTodoCard[]>([]);
  const cardsRef = useRef(cards);
  const sensors = useSensors(
    useSensor(MouseSensor, {activationConstraint: {distance: 8}}),
    useSensor(TouchSensor, {activationConstraint: {delay: 200, tolerance: 8}}),
  );
  const manageCols = canManageTodoColumns(podRole, isSpaceOwner);
  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);
  const collisionDetection = useMemo(
    () => createTodoBoardCollisionDetection(() => dragType, () => columnIds),
    [columnIds, dragType],
  );
  const taggedCards = useMemo(() => filterTodoCardsByTags(cards, tagFilter), [cards, tagFilter]);
  const availableTags = useMemo(() => {
    const source = showArchived ? cards : cards.filter((card) => card.columnId !== undefined);
    return listUniqueTodoCardTags(source);
  }, [cards, showArchived]);
  const listCards = useMemo(() => {
    const visible = taggedCards.filter((card) => card.columnId !== undefined || showArchived);
    return sortTodoCardsByColumnOrder(visible, columnIds);
  }, [taggedCards, showArchived, columnIds]);
  const cardCountByColumn = useMemo(
    () => Object.fromEntries(columns.map((column) => [column.id, cards.filter((card) => card.columnId === column.id).length])),
    [columns, cards],
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
      const ordered = mergeTodoCardSort(prev, next);
      const unchanged = ordered.every(
        (card, index) =>
          card.id === prev[index]?.id &&
          card.columnId === prev[index]?.columnId &&
          card.sortOrder === prev[index]?.sortOrder,
      );
      if (unchanged) {
        return prev;
      }
      return ordered;
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

  const archived = taggedCards.filter((c) => c.columnId === undefined);
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

  const toggleTag = (tag: string): void => {
    setTagFilter((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  };

  return (
    <Stack gap={4}>
      <TodoListBoardToolbar
        canManageColumns={manageCols}
        availableTags={availableTags}
        selectedTags={tagFilter}
        singleList={singleList}
        showArchived={showArchived}
        onAddColumn={() => setAddOpen(true)}
        onToggleTag={toggleTag}
        onClearTags={() => setTagFilter([])}
        onSingleListChange={setSingleList}
        onShowArchivedChange={setShowArchived}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        measuring={{droppable: {strategy: MeasuringStrategy.Always}}}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragCancel={onDragCancel}
        onDragEnd={(e) => void onDragEnd(e)}
      >
        {singleList ? (
          <TodoListBoardSingleList
            podId={podId}
            userId={userId}
            columns={columns}
            cards={listCards}
            cardCountByColumn={cardCountByColumn}
            showArchived={showArchived}
            canManageColumns={manageCols}
            assigneeName={assigneeName}
            onOpenCard={setOpenCard}
            onCompleteCard={(card) => void completeCard(card)}
            onArchiveCard={(card) => void archiveCard(card)}
            onDeleteCard={(card) => void deleteCard(card)}
            onChanged={() => void load()}
          />
        ) : (
          <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
            <HStack align="start" overflowX="auto" gap={3}>
              {columns.map((column) => (
                <TodoListBoardColumn
                  key={column.id}
                  column={column}
                  cards={taggedCards.filter((c) => c.columnId === column.id)}
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
        )}
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
