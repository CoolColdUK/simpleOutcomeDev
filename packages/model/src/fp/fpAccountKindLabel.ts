import {FpAccountKind} from './fpAccountKind';

export default function fpAccountKindLabel(kind: FpAccountKind): string {
  if (kind === FpAccountKind.CURRENT) {
    return 'Current';
  }
  if (kind === FpAccountKind.SAVINGS) {
    return 'Savings';
  }
  if (kind === FpAccountKind.CREDIT_CARD) {
    return 'Credit card';
  }
  if (kind === FpAccountKind.CASH) {
    return 'Cash';
  }
  return 'Other';
}
