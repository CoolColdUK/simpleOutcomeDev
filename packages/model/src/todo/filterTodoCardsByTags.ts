export default function filterTodoCardsByTags<T extends {readonly tags: readonly string[]}>(
  cards: readonly T[],
  selectedTags: readonly string[],
): readonly T[] {
  if (selectedTags.length === 0) {
    return cards;
  }
  const selected = new Set(selectedTags);
  return cards.filter((card) => card.tags.some((tag) => selected.has(tag)));
}
