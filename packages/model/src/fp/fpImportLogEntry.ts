import {FpImportLogKind} from './fpImportLogKind';

export interface FpImportLogEntry {
  readonly kind: FpImportLogKind;
  readonly rowIndex: number;
  readonly message: string;
  readonly fileLine?: number;
  readonly raw?: string;
}
