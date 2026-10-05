import {FpCategoryDirection} from './fpCategoryDirection';

export default function fpCategoryDirectionSortOrder(direction: FpCategoryDirection): number {
  if (direction === FpCategoryDirection.INCOME) {
    return 0;
  }
  if (direction === FpCategoryDirection.EXPENSE) {
    return 1;
  }
  if (direction === FpCategoryDirection.SAVING) {
    return 2;
  }
  return 3;
}
