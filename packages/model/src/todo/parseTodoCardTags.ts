import * as v from 'valibot';

const tagSchema = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(32));

export const todoCardTagsSchema = v.pipe(v.array(tagSchema), v.maxLength(20));

export default function parseTodoCardTags(input: unknown): readonly string[] {
  return v.parse(todoCardTagsSchema, input);
}
