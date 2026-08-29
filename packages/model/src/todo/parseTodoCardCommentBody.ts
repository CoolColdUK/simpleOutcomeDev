import * as v from 'valibot';

export const todoCardCommentBodySchema = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(4000));

export default function parseTodoCardCommentBody(input: unknown): string {
  return v.parse(todoCardCommentBodySchema, input);
}
