import {FpImportLogKind} from './fpImportLogKind';
import type {FpImportLogEntry} from './fpImportLogEntry';

const KINDS = new Set<string>(Object.values(FpImportLogKind));

function parseKind(value: unknown): FpImportLogKind {
  if (typeof value === 'string' && KINDS.has(value)) {
    return value as FpImportLogKind;
  }
  return FpImportLogKind.ERROR;
}

function parseOne(input: unknown): FpImportLogEntry | undefined {
  if (input === undefined || typeof input !== 'object' || input === null) {
    return undefined;
  }
  const raw = input as Record<string, unknown>;
  if (typeof raw['message'] !== 'string' || raw['message'].trim() === '') {
    return undefined;
  }
  if (typeof raw['rowIndex'] !== 'number' || Number.isNaN(raw['rowIndex'])) {
    return undefined;
  }
  const fileLine = raw['fileLine'];
  const snippet = raw['raw'];
  return {
    kind: parseKind(raw['kind']),
    rowIndex: raw['rowIndex'],
    message: raw['message'],
    fileLine: typeof fileLine === 'number' && !Number.isNaN(fileLine) ? fileLine : undefined,
    raw: typeof snippet === 'string' ? snippet : undefined,
  };
}

export default function parseFpImportLogs(input: unknown): readonly FpImportLogEntry[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.flatMap((item) => {
    const entry = parseOne(item);
    return entry === undefined ? [] : [entry];
  });
}
