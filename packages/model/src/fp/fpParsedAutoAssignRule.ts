import type {FpAmountOperator} from './fpAmountOperator';

export interface FpParsedAutoAssignRule {
  readonly description?: string;
  readonly recipient?: string;
  readonly amount?: number;
  readonly amountOperator?: FpAmountOperator;
}
