import {randomBytes} from 'node:crypto';
import dayjs from 'dayjs';
import {
  agentSpaceInviteCreateSchema,
  agentSpaceInviteDeleteSchema,
  agentSpaceMemberRoleSchema,
  agentSpaceUpdateSchema,
  ApiKeyAction,
  ApiKeyResource,
  deriveSpaceInviteStatus,
  effectiveApiKeyPermissions,
  safeParseSchema,
  SpaceRole,
} from '@so/model';
import {agentErr, agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import loadAgentContext, {loadGrantedSpaceAccess, requireAgentCall, type AgentContext} from '@/lib/api/agent/loadAgentContext';

function validation(message: string): AgentResult<never> {
  return agentErr(400, 'validation', message);
}

function spaceDescriptionPatch(description: string | null | undefined): {readonly description: string | null} | Record<string, never> {
  if (description === undefined) {
    return {};
  }
  if (description === null || description.trim() === '') {
    return {description: null};
  }
  return {description: description.trim()};
}

export async function getAgentApiKeyPermissions(request: Request): Promise<AgentResult<unknown>> {
  const ctx = await loadAgentContext(request);
  if (!ctx.ok) {
    return ctx;
  }
  const spaces = await loadGrantedSpaceAccess(ctx.data.supabase, ctx.data.record.ownerUserId, ctx.data.record.permissions);
  if (!spaces.ok) {
    return spaces;
  }
  return agentOk({
    id: ctx.data.record.id,
    name: ctx.data.keyName,
    prefix: ctx.data.keyPrefix,
    ...effectiveApiKeyPermissions(ctx.data.record, spaces.data, ctx.data.nowIso),
  });
}

export async function getAgentSpace(request: Request, spaceId: string): Promise<AgentResult<unknown>> {
  const ctx = await requireAgentCall(request, {spaceId, resource: ApiKeyResource.SPACE, action: ApiKeyAction.READ});
  if (!ctx.ok) {
    return ctx;
  }
  const space = await ctx.data.supabase.from('space').select('id, name, description').eq('id', spaceId).maybeSingle();
  const spaceErr = dbErr(space.error);
  if (spaceErr !== undefined) {
    return spaceErr;
  }
  if (space.data === null) {
    return agentErr(404, 'not_found', 'Space not found');
  }
  return agentOk({id: space.data.id, name: space.data.name, description: space.data.description ?? undefined});
}

export async function updateAgentSpace(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentSpaceUpdateSchema, input);
  if (!parsed.ok) {
    return validation(parsed.message);
  }
  const ctx = await requireAgentCall(request, {
    spaceId: parsed.value.spaceId,
    resource: ApiKeyResource.SPACE,
    action: ApiKeyAction.UPDATE,
  });
  if (!ctx.ok) {
    return ctx;
  }
  const updated = await ctx.data.supabase
    .from('space')
    .update({
      name: parsed.value.name,
      ...spaceDescriptionPatch(parsed.value.description),
    })
    .eq('id', parsed.value.spaceId)
    .select('id');
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  if ((updated.data ?? []).length === 0) {
    return agentErr(404, 'not_found', 'Space not found');
  }
  return agentOk({id: parsed.value.spaceId});
}

export async function listAgentSpacePods(request: Request, spaceId: string): Promise<AgentResult<{readonly pods: readonly unknown[]}>> {
  const ctx = await requireAgentCall(request, {spaceId, resource: ApiKeyResource.SPACE, action: ApiKeyAction.READ});
  if (!ctx.ok) {
    return ctx;
  }
  const visible = new Set(
    effectiveApiKeyPermissions(ctx.data.record, [{spaceId, access: ctx.data.access}], ctx.data.nowIso).pods.map((pod) => pod.podId),
  );
  const ids = [...visible];
  if (ids.length === 0) {
    return agentOk({pods: []});
  }
  const pods = await ctx.data.supabase
    .from('pod')
    .select('id, feature, name, description, visibility, status')
    .eq('space_id', spaceId)
    .in('id', ids);
  const podsErr = dbErr(pods.error);
  if (podsErr !== undefined) {
    return podsErr;
  }
  return agentOk({
    pods: (pods.data ?? []).map((pod) => ({
      id: pod.id,
      feature: pod.feature,
      name: pod.name ?? undefined,
      description: pod.description ?? undefined,
      visibility: pod.visibility,
      status: pod.status,
    })),
  });
}

export async function listAgentSpaceMembers(request: Request, spaceId: string): Promise<AgentResult<{readonly members: readonly unknown[]}>> {
  const ctx = await requireAgentCall(request, {
    spaceId,
    resource: ApiKeyResource.GROUP,
    action: ApiKeyAction.READ,
    groupTarget: 'member',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const members = await ctx.data.supabase.from('space_member').select('user_id, role, profile:profile(username)').eq('space_id', spaceId);
  const membersErr = dbErr(members.error);
  if (membersErr !== undefined) {
    return membersErr;
  }
  const rows = (members.data ?? []) as unknown as readonly {
    readonly user_id: string;
    readonly role: string;
    readonly profile: {readonly username: string | null} | null;
  }[];
  return agentOk({
    members: rows.map((row) => ({
      userId: row.user_id,
      role: row.role,
      username: row.profile?.username ?? undefined,
    })),
  });
}

export async function updateAgentSpaceMemberRole(request: Request, input: unknown): Promise<AgentResult<{readonly userId: string}>> {
  const parsed = safeParseSchema(agentSpaceMemberRoleSchema, input);
  if (!parsed.ok) {
    return validation(parsed.message);
  }
  const ctx = await requireAgentCall(request, {
    spaceId: parsed.value.spaceId,
    resource: ApiKeyResource.GROUP,
    action: ApiKeyAction.UPDATE,
    groupTarget: 'member',
  });
  if (!ctx.ok) {
    return ctx;
  }
  if (parsed.value.userId === ctx.data.record.ownerUserId) {
    return agentErr(403, 'forbidden', 'Cannot change your own space role');
  }
  const updated = await ctx.data.supabase
    .from('space_member')
    .update({role: parsed.value.role})
    .eq('space_id', parsed.value.spaceId)
    .eq('user_id', parsed.value.userId)
    .neq('role', SpaceRole.OWNER)
    .select('user_id');
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  if ((updated.data ?? []).length === 0) {
    return agentErr(404, 'not_found', 'Member not found');
  }
  return agentOk({userId: parsed.value.userId});
}

export async function listAgentSpaceInvites(request: Request, spaceId: string): Promise<AgentResult<{readonly invites: readonly unknown[]}>> {
  const ctx = await requireAgentCall(request, {
    spaceId,
    resource: ApiKeyResource.GROUP,
    action: ApiKeyAction.READ,
    groupTarget: 'invite',
  });
  if (!ctx.ok) {
    return ctx;
  }
  return readInvites(ctx.data, spaceId);
}

async function readInvites(ctx: AgentContext, spaceId: string): Promise<AgentResult<{readonly invites: readonly unknown[]}>> {
  const invites = await ctx.supabase
    .from('space_invite')
    .select('id, token_prefix, max_uses, use_count, expires_at, disabled_at, created_at')
    .eq('space_id', spaceId)
    .order('created_at', {ascending: false});
  const invitesErr = dbErr(invites.error);
  if (invitesErr !== undefined) {
    return invitesErr;
  }
  return agentOk({
    invites: (invites.data ?? []).map((row) => ({
      id: row.id,
      tokenPrefix: row.token_prefix,
      maxUses: row.max_uses,
      useCount: row.use_count,
      expiresAt: row.expires_at ?? undefined,
      disabledAt: row.disabled_at ?? undefined,
      createdAt: row.created_at,
      status: deriveSpaceInviteStatus({
        disabledAt: row.disabled_at ?? undefined,
        expiresAt: row.expires_at ?? undefined,
        useCount: row.use_count,
        maxUses: row.max_uses,
        nowIso: ctx.nowIso,
      }),
    })),
  });
}

export async function createAgentSpaceInvite(request: Request, input: unknown): Promise<AgentResult<{readonly token: string}>> {
  const parsed = safeParseSchema(agentSpaceInviteCreateSchema, input);
  if (!parsed.ok) {
    return validation(parsed.message);
  }
  const ctx = await requireAgentCall(request, {
    spaceId: parsed.value.spaceId,
    resource: ApiKeyResource.GROUP,
    action: ApiKeyAction.CREATE,
    groupTarget: 'invite',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const token = randomBytes(32).toString('hex');
  const inserted = await ctx.data.supabase.rpc('create_agent_space_invite', {
    p_space_id: parsed.value.spaceId,
    p_token: token,
    p_max_uses: parsed.value.maxUses,
    p_expires_at: dayjs().add(parsed.value.expiresInDays, 'day').toISOString(),
    p_created_by: ctx.data.record.ownerUserId,
  });
  const insertedErr = dbErr(inserted.error);
  if (insertedErr !== undefined) {
    return insertedErr;
  }
  return agentOk({token});
}

export async function deleteAgentSpaceInvite(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentSpaceInviteDeleteSchema, input);
  if (!parsed.ok) {
    return validation(parsed.message);
  }
  const ctx = await requireAgentCall(request, {
    spaceId: parsed.value.spaceId,
    resource: ApiKeyResource.GROUP,
    action: ApiKeyAction.DELETE,
    groupTarget: 'invite',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const removed = await ctx.data.supabase
    .from('space_invite')
    .delete()
    .eq('id', parsed.value.inviteId)
    .eq('space_id', parsed.value.spaceId)
    .select('id');
  const removedErr = dbErr(removed.error);
  if (removedErr !== undefined) {
    return removedErr;
  }
  if ((removed.data ?? []).length === 0) {
    return agentErr(404, 'not_found', 'Invite not found');
  }
  return agentOk({id: parsed.value.inviteId});
}
