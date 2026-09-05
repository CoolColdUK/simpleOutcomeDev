import {FpAmountSign} from './fpAmountSign';
import {FpColumnTarget} from './fpColumnTarget';

export interface FpColumnMapping {
  readonly column: string;
  readonly dateFormat?: string;
  readonly sign?: FpAmountSign;
}

export type FpColumnMap = Partial<Record<FpColumnTarget, FpColumnMapping>>;
