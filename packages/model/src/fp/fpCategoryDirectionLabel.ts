import {FpCategoryDirection} from './fpCategoryDirection';

export default function fpCategoryDirectionLabel(direction: FpCategoryDirection): string {
  if (direction === FpCategoryDirection.TRANSFER) {
    return 'Transfer';
  }
  if (direction === FpCategoryDirection.INCOME) {
    return 'Income';
  }
  if (direction === FpCategoryDirection.EXPENSE) {
    return 'Expense';
  }
  return 'Saving';
}
