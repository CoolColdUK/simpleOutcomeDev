export interface TpAgentWarning {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

/** Attach warnings only when the list is non-empty. Success bodies omit the key otherwise. */
export function payloadWithTpWarnings<T extends object>(
  payload: T,
  warnings: readonly TpAgentWarning[],
): T | (T & {readonly warnings: readonly TpAgentWarning[]}) {
  if (warnings.length === 0) {
    return payload;
  }
  return {...payload, warnings};
}
