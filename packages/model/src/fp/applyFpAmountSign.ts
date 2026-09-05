import {FpAmountSign} from './fpAmountSign';

export default function applyFpAmountSign(amount: number, sign: FpAmountSign): number {
  if (sign === FpAmountSign.INVERT) {
    return -amount;
  }
  if (sign === FpAmountSign.ALL_NEGATIVE) {
    return -Math.abs(amount);
  }
  if (sign === FpAmountSign.ALL_POSITIVE) {
    return Math.abs(amount);
  }
  return amount;
}
