import * as v from 'valibot';
import {SPACE_INVITE_DAYS_MAX, SPACE_INVITE_DAYS_MIN} from './spaceInviteDays';

const spaceInviteDaysSchema = v.pipe(
  v.union([v.number(), v.string()]),
  v.transform((value) => (typeof value === 'number' ? value : Number(value.trim()))),
  v.number(),
  v.integer(),
  v.minValue(SPACE_INVITE_DAYS_MIN),
  v.maxValue(SPACE_INVITE_DAYS_MAX),
);

export default function parseSpaceInviteDays(input: unknown): number {
  return v.parse(spaceInviteDaysSchema, input);
}
