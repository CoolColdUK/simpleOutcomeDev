import {TODO_ARCHIVE_COLUMN_ID} from '@so/model';
import type {DbTodoColumn} from '@/lib/api/db/listDbTodoColumns';
import type {DbTodoCard} from '@/lib/api/db/mapDbTodoCard';

export default function destTodoColumnId(
  overId: string,
  columns: readonly DbTodoColumn[],
  cards: readonly DbTodoCard[],
): string | undefined {
  if (overId === TODO_ARCHIVE_COLUMN_ID) {
    return undefined;
  }
  if (columns.some((c) => c.id === overId)) {
    return overId;
  }
  return cards.find((c) => c.id === overId)?.columnId;
}
