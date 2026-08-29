import {closestCorners, pointerWithin, rectIntersection, type CollisionDetection} from '@dnd-kit/core';

export default function createTodoBoardCollisionDetection(
  getDragType: () => string | undefined,
  getColumnIds: () => readonly string[],
): CollisionDetection {
  return (args) => {
    if (getDragType() === 'column') {
      const columnIds = new Set(getColumnIds());
      return closestCorners({
        ...args,
        droppableContainers: args.droppableContainers.filter((container) => columnIds.has(String(container.id))),
      });
    }
    const pointerHits = pointerWithin(args);
    const columnIds = new Set(getColumnIds());
    const cardHits = pointerHits.filter((hit) => !columnIds.has(String(hit.id)));
    if (cardHits.length > 0) {
      return cardHits;
    }
    if (pointerHits.length > 0) {
      return pointerHits;
    }
    return rectIntersection(args);
  };
}
