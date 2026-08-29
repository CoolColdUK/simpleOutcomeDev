import type {DbTodoCard} from '@/lib/api/db/mapDbTodoCard';
import type {TodoCardSortItem} from '@so/model';

export default function mergeTodoCardSort(cards: readonly DbTodoCard[], next: readonly TodoCardSortItem[]): readonly DbTodoCard[] {
  const byId = new Map(cards.map((c) => [c.id, c]));
  const counts = new Map<string, number>();
  return next.flatMap((item) => {
    const card = byId.get(item.id);
    if (card === undefined) {
      return [];
    }
    const key = item.columnId ?? '';
    const sortOrder = counts.get(key) ?? 0;
    counts.set(key, sortOrder + 1);
    return [{...card, columnId: item.columnId, sortOrder}];
  });
}
