import fpImportLogKindLabel from './fpImportLogKindLabel';
import {FpImportLogKind} from './fpImportLogKind';

describe('fpImportLogKindLabel', () => {
  it('labels parse errors', () => {
    expect(fpImportLogKindLabel(FpImportLogKind.PARSE)).toBe('Parse error');
  });
});
