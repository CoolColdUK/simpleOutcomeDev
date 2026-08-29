import {TODO_ARCHIVE_COLUMN_ID} from './constants';

export interface TodoCardSortItem {
  readonly id: string;
  readonly columnId: string | undefined;
}

export interface ApplyTodoCardDragInput {
  readonly cards: readonly TodoCardSortItem[];
  readonly activeId: string;
  readonly overId: string;
  readonly columnIds: readonly string[];
}

function destColumnId(
  overId: string,
  columnIds: readonly string[],
  cards: readonly TodoCardSortItem[],
): string | undefined {
  if (overId === TODO_ARCHIVE_COLUMN_ID) {
    return undefined;
  }
  if (columnIds.includes(overId)) {
    return overId;
  }
  return cards.find((c) => c.id === overId)?.columnId;
}

export default function applyTodoCardDrag(input: ApplyTodoCardDragInput): readonly TodoCardSortItem[] | undefined {
  const {cards, activeId, overId, columnIds} = input;
  if (activeId === overId) {
    return undefined;
  }
  const active = cards.find((c) => c.id === activeId);
  if (active === undefined) {
    return undefined;
  }
  const dest = destColumnId(overId, columnIds, cards);
  const without = cards.filter((c) => c.id !== activeId);
  const destCards = without.filter((c) => c.columnId === dest);
  const rest = without.filter((c) => c.columnId !== dest);
  const overIndex = destCards.findIndex((c) => c.id === overId);
  const insertAt = overIndex >= 0 ? overIndex : destCards.length;
  const destNext = [...destCards.slice(0, insertAt), {id: active.id, columnId: dest}, ...destCards.slice(insertAt)];
  const next = [...rest, ...destNext];
  const same = next.every(
    (item, index) => item.id === cards[index]?.id && item.columnId === cards[index]?.columnId,
  );
  if (same) {
    return undefined;
  }
  return next;
}
