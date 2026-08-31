export default function sortTodoCardsByColumnOrder<
  T extends {readonly columnId: string | undefined; readonly sortOrder: number},
>(cards: readonly T[], columnIds: readonly string[]): readonly T[] {
  const indexById = new Map(columnIds.map((id, index) => [id, index]));
  return [...cards].sort((a, b) => {
    const ai = a.columnId === undefined ? columnIds.length : (indexById.get(a.columnId) ?? columnIds.length);
    const bi = b.columnId === undefined ? columnIds.length : (indexById.get(b.columnId) ?? columnIds.length);
    if (ai !== bi) {
      return ai - bi;
    }
    return a.sortOrder - b.sortOrder;
  });
}
