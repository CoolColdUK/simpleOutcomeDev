import {FpImportLogKind} from './fpImportLogKind';

export default function fpImportLogKindLabel(kind: FpImportLogKind): string {
  if (kind === FpImportLogKind.PARSE) {
    return 'Parse error';
  }
  if (kind === FpImportLogKind.DUPLICATE) {
    return 'Skipped duplicate';
  }
  return 'Import error';
}
