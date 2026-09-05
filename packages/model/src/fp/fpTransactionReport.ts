export function fpCountsTowardBalance(archived: boolean, parentId: string | undefined): boolean {
  return !archived && parentId === undefined;
}

export function fpCountsTowardCategoryReport(
  archived: boolean,
  id: string,
  parentId: string | undefined,
  parentIdsWithChildren: ReadonlySet<string>,
): boolean {
  if (archived) {
    return false;
  }
  if (parentId !== undefined) {
    return true;
  }
  return !parentIdsWithChildren.has(id);
}

export function fpInDateRange(postedDate: string, startDate: string | undefined, endDate: string | undefined): boolean {
  if (startDate !== undefined && postedDate < startDate) {
    return false;
  }
  if (endDate !== undefined && postedDate > endDate) {
    return false;
  }
  return true;
}
