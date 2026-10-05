export const FP_CATEGORY_FILTER_ALL = '';
export const FP_CATEGORY_FILTER_UNCATEGORISED = '__uncategorised__';

export function transactionMatchesFpCategoryFilter(
  categoryId: string | undefined,
  filter: string,
): boolean {
  if (filter === FP_CATEGORY_FILTER_ALL) {
    return true;
  }
  if (filter === FP_CATEGORY_FILTER_UNCATEGORISED) {
    return categoryId === undefined;
  }
  return categoryId === filter;
}
