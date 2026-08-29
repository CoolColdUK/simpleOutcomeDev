import * as v from 'valibot';

export const todoCardTitleSchema = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200));

export default function parseTodoCardTitle(input: unknown): string {
  return v.parse(todoCardTitleSchema, input);
}
