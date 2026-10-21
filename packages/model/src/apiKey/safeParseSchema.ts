import * as v from 'valibot';

export interface SafeParseSuccess<T> {
  readonly ok: true;
  readonly value: T;
}

export interface SafeParseFailure {
  readonly ok: false;
  readonly message: string;
}

export default function safeParseSchema<T>(
  schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>,
  input: unknown,
): SafeParseSuccess<T> | SafeParseFailure {
  const result = v.safeParse(schema, input);
  if (result.success) {
    return {ok: true, value: result.output};
  }
  return {ok: false, message: result.issues[0]?.message ?? 'Invalid input'};
}
