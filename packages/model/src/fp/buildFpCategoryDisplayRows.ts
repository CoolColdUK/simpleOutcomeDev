import {FpCategoryDirection} from './fpCategoryDirection';
import fpCategoryDirectionSortOrder from './fpCategoryDirectionSortOrder';

export interface FpCategoryDisplayInput {
  readonly id: string;
  readonly name: string;
  readonly direction: FpCategoryDirection;
  readonly favourite: boolean;
  readonly sortOrder: number;
  readonly isGroup: boolean;
  readonly parentId?: string;
}

export interface FpCategoryDisplayRow {
  readonly category: FpCategoryDisplayInput;
  readonly isChild: boolean;
}

function compareFpCategoryDisplay(a: FpCategoryDisplayInput, b: FpCategoryDisplayInput): number {
  const directionDelta =
    fpCategoryDirectionSortOrder(a.direction) - fpCategoryDirectionSortOrder(b.direction);
  if (directionDelta !== 0) {
    return directionDelta;
  }
  const favouriteDelta = Number(b.favourite) - Number(a.favourite);
  if (favouriteDelta !== 0) {
    return favouriteDelta;
  }
  const sortOrderDelta = a.sortOrder - b.sortOrder;
  if (sortOrderDelta !== 0) {
    return sortOrderDelta;
  }
  return a.name.localeCompare(b.name);
}

export default function buildFpCategoryDisplayRows(
  categories: readonly FpCategoryDisplayInput[],
): readonly FpCategoryDisplayRow[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const childrenByParent = new Map<string, FpCategoryDisplayInput[]>();
  categories.forEach((category) => {
    if (category.parentId === undefined) {
      return;
    }
    const siblings = childrenByParent.get(category.parentId) ?? [];
    childrenByParent.set(category.parentId, [...siblings, category]);
  });

  const topLevel = categories.filter((category) => {
    if (category.parentId === undefined) {
      return true;
    }
    return byId.get(category.parentId) === undefined;
  });

  const sortedTop = [...topLevel].sort(compareFpCategoryDisplay);

  return sortedTop.flatMap((category) => {
    const parentRow: FpCategoryDisplayRow = {category, isChild: false};
    const children = [...(childrenByParent.get(category.id) ?? [])].sort(compareFpCategoryDisplay);
    const childRows: FpCategoryDisplayRow[] = children.map((child) => ({
      category: child,
      isChild: true,
    }));
    return [parentRow, ...childRows];
  });
}
