import * as v from 'valibot';
import {SPACE_INVITE_DAYS_MAX, SPACE_INVITE_DAYS_MIN} from '../space/spaceInviteDays';
import {SPACE_INVITE_MAX_USES_MAX, SPACE_INVITE_MAX_USES_MIN} from '../space/spaceInviteMaxUses';
import {SpaceRole} from '../space/spaceRole';

const uuid = () => v.pipe(v.string(), v.uuid());

export const agentSpaceUpdateSchema = v.object({
  spaceId: uuid(),
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(80)),
  description: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(2000)))),
});

export const agentSpaceInviteCreateSchema = v.object({
  spaceId: uuid(),
  expiresInDays: v.pipe(v.number(), v.integer(), v.minValue(SPACE_INVITE_DAYS_MIN), v.maxValue(SPACE_INVITE_DAYS_MAX)),
  maxUses: v.pipe(v.number(), v.integer(), v.minValue(SPACE_INVITE_MAX_USES_MIN), v.maxValue(SPACE_INVITE_MAX_USES_MAX)),
});

export const agentSpaceMemberRoleSchema = v.object({
  spaceId: uuid(),
  userId: uuid(),
  role: v.picklist([SpaceRole.ADMIN, SpaceRole.USER]),
});

export const agentSpaceInviteDeleteSchema = v.object({
  spaceId: uuid(),
  inviteId: uuid(),
});
