export default function listUniqueTodoCardTags(
  cards: readonly {readonly tags: readonly string[]}[],
): readonly string[] {
  const seen = new Set<string>();
  cards.forEach((card) => {
    card.tags.forEach((tag) => {
      seen.add(tag);
    });
  });
  return [...seen].sort((a, b) => a.localeCompare(b));
}
