import * as v from 'valibot';

export const todoColumnTitleSchema = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(80));

export default function parseTodoColumnTitle(input: unknown): string {
  return v.parse(todoColumnTitleSchema, input);
}
