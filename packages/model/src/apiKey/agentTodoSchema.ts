import * as v from 'valibot';
import {todoCardCommentBodySchema} from '../todo/parseTodoCardCommentBody';
import {todoCardTagsSchema} from '../todo/parseTodoCardTags';
import {todoCardTitleSchema} from '../todo/parseTodoCardTitle';
import {todoColumnTitleSchema} from '../todo/parseTodoColumnTitle';

const uuid = () => v.pipe(v.string(), v.uuid());
const sortOrder = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(1_000_000));

export const agentTodoColumnCreateSchema = v.object({
  podId: uuid(),
  title: todoColumnTitleSchema,
  sortOrder: v.optional(sortOrder),
});

export const agentTodoColumnUpdateSchema = v.object({
  podId: uuid(),
  columnId: uuid(),
  title: v.optional(todoColumnTitleSchema),
  sortOrder: v.optional(sortOrder),
});

export const agentTodoCardCreateSchema = v.object({
  podId: uuid(),
  title: todoCardTitleSchema,
  columnId: uuid(),
  description: v.optional(v.pipe(v.string(), v.maxLength(20000))),
  tags: v.optional(todoCardTagsSchema),
  dueAt: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(40)))),
  sortOrder: v.optional(sortOrder),
});

export const agentTodoCardUpdateSchema = v.object({
  podId: uuid(),
  cardId: uuid(),
  title: v.optional(todoCardTitleSchema),
  columnId: v.optional(v.nullable(uuid())),
  description: v.optional(v.pipe(v.string(), v.maxLength(20000))),
  tags: v.optional(todoCardTagsSchema),
  dueAt: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(40)))),
  sortOrder: v.optional(sortOrder),
  completedAt: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(40)))),
  assigneeUserId: v.optional(v.nullable(uuid())),
});

export const agentTodoCommentCreateSchema = v.object({
  podId: uuid(),
  cardId: uuid(),
  body: todoCardCommentBodySchema,
});

export const agentTodoCommentUpdateSchema = v.object({
  podId: uuid(),
  cardId: uuid(),
  commentId: uuid(),
  body: todoCardCommentBodySchema,
});

export const agentTodoIdSchema = v.object({
  podId: uuid(),
  cardId: v.optional(uuid()),
  columnId: v.optional(uuid()),
  commentId: v.optional(uuid()),
  tag: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(32))),
  limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100))),
  offset: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(100_000))),
});
