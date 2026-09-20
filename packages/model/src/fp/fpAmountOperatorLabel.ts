import {FpAmountOperator} from './fpAmountOperator';

const LABELS: Record<FpAmountOperator, string> = {
  [FpAmountOperator.EQ]: 'equal',
  [FpAmountOperator.LT]: 'smaller',
  [FpAmountOperator.LTE]: 'smaller or equal',
  [FpAmountOperator.GT]: 'larger',
  [FpAmountOperator.GTE]: 'larger or equal',
};

export default function fpAmountOperatorLabel(operator: FpAmountOperator): string {
  return LABELS[operator];
}
