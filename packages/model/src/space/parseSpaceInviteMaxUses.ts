import * as v from 'valibot';
import {SPACE_INVITE_MAX_USES_MAX, SPACE_INVITE_MAX_USES_MIN} from './spaceInviteMaxUses';

const spaceInviteMaxUsesSchema = v.pipe(
  v.union([v.number(), v.string()]),
  v.transform((value) => (typeof value === 'number' ? value : Number(value.trim()))),
  v.number(),
  v.integer(),
  v.minValue(SPACE_INVITE_MAX_USES_MIN),
  v.maxValue(SPACE_INVITE_MAX_USES_MAX),
);

export default function parseSpaceInviteMaxUses(input: unknown): number {
  return v.parse(spaceInviteMaxUsesSchema, input);
}
