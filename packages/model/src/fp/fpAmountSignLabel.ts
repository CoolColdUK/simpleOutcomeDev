import {FpAmountSign} from './fpAmountSign';

export default function fpAmountSignLabel(sign: FpAmountSign): string {
  if (sign === FpAmountSign.INVERT) {
    return 'Invert sign';
  }
  if (sign === FpAmountSign.ALL_NEGATIVE) {
    return 'Force negative';
  }
  if (sign === FpAmountSign.ALL_POSITIVE) {
    return 'Force positive';
  }
  return 'Keep as-is';
}
