import {
  agentPodIdSchema,
  agentPodJoinRequestSchema,
  agentPodMemberAddSchema,
  agentPodMemberRoleSchema,
  agentSpaceInviteDisableSchema,
  ApiKeyAction,
  ApiKeyResource,
  PodRole,
  safeParseSchema,
  SpaceRole,
} from '@so/model';
import {agentErr, agentOk, agentValidation, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requireAgentCall, requirePodAgent, type AgentContext} from '@/lib/api/agent/loadAgentContext';

function canAssignPodAdmin(ctx: AgentContext, podId: string): boolean {
  const pod = ctx.access.pods.find((item) => item.id === podId);
  return ctx.access.spaceRole === SpaceRole.OWNER || pod?.role === PodRole.OWNER;
}

export async function disableAgentSpaceInvite(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentSpaceInviteDisableSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
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
  const updated = await ctx.data.supabase
    .from('space_invite')
    .update({disabled_at: ctx.data.nowIso})
    .eq('id', parsed.value.inviteId)
    .eq('space_id', parsed.value.spaceId)
    .is('disabled_at', null)
    .select('id');
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  if ((updated.data ?? []).length > 0) {
    return agentOk({id: parsed.value.inviteId});
  }
  const existing = await ctx.data.supabase
    .from('space_invite')
    .select('id')
    .eq('id', parsed.value.inviteId)
    .eq('space_id', parsed.value.spaceId)
    .maybeSingle();
  const existingErr = dbErr(existing.error);
  if (existingErr !== undefined) {
    return existingErr;
  }
  if (existing.data === null) {
    return agentErr(404, 'not_found', 'Invite not found');
  }
  return agentOk({id: parsed.value.inviteId});
}

export async function listAgentPodMembers(request: Request, input: unknown): Promise<AgentResult<{readonly members: readonly unknown[]}>> {
  const parsed = safeParseSchema(agentPodIdSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.GROUP,
    action: ApiKeyAction.READ,
    groupTarget: 'podMember',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const members = await ctx.data.supabase.from('pod_member').select('user_id, role, profile:profile(username)').eq('pod_id', parsed.value.podId);
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

export async function addAgentPodMemberByUsername(request: Request, input: unknown): Promise<AgentResult<{readonly userId: string}>> {
  const parsed = safeParseSchema(agentPodMemberAddSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.GROUP,
    action: ApiKeyAction.CREATE,
    groupTarget: 'podMember',
  });
  if (!ctx.ok) {
    return ctx;
  }
  if (parsed.value.role === PodRole.ADMIN && !canAssignPodAdmin(ctx.data, parsed.value.podId)) {
    return agentErr(403, 'forbidden', 'Only the pod owner can assign pod admin');
  }
  const profile = await ctx.data.supabase
    .from('profile')
    .select('id')
    .eq('username_normalized', parsed.value.username.toLowerCase())
    .maybeSingle();
  const profileErr = dbErr(profile.error);
  if (profileErr !== undefined) {
    return profileErr;
  }
  if (profile.data === null) {
    return agentErr(404, 'not_found', 'user not found');
  }
  const spaceMember = await ctx.data.supabase
    .from('space_member')
    .select('user_id')
    .eq('space_id', ctx.data.spaceId)
    .eq('user_id', profile.data.id)
    .maybeSingle();
  const spaceMemberErr = dbErr(spaceMember.error);
  if (spaceMemberErr !== undefined) {
    return spaceMemberErr;
  }
  if (spaceMember.data === null) {
    return agentErr(400, 'validation', 'user is not in this space');
  }
  const existing = await ctx.data.supabase
    .from('pod_member')
    .select('role')
    .eq('pod_id', parsed.value.podId)
    .eq('user_id', profile.data.id)
    .maybeSingle();
  const existingErr = dbErr(existing.error);
  if (existingErr !== undefined) {
    return existingErr;
  }
  if (existing.data === null) {
    const inserted = await ctx.data.supabase.from('pod_member').insert({
      pod_id: parsed.value.podId,
      user_id: profile.data.id,
      role: parsed.value.role,
    });
    const insertedErr = dbErr(inserted.error);
    if (insertedErr !== undefined) {
      return insertedErr;
    }
    return agentOk({userId: profile.data.id});
  }
  if (existing.data.role === PodRole.OWNER) {
    return agentOk({userId: profile.data.id});
  }
  const updated = await ctx.data.supabase
    .from('pod_member')
    .update({role: parsed.value.role})
    .eq('pod_id', parsed.value.podId)
    .eq('user_id', profile.data.id)
    .neq('role', PodRole.OWNER);
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  return agentOk({userId: profile.data.id});
}

export async function updateAgentPodMemberRole(request: Request, input: unknown): Promise<AgentResult<{readonly userId: string}>> {
  const parsed = safeParseSchema(agentPodMemberRoleSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.GROUP,
    action: ApiKeyAction.UPDATE,
    groupTarget: 'podMember',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const updated = await ctx.data.supabase
    .from('pod_member')
    .update({role: parsed.value.role})
    .eq('pod_id', parsed.value.podId)
    .eq('user_id', parsed.value.userId)
    .neq('role', PodRole.OWNER)
    .select('user_id');
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  if ((updated.data ?? []).length === 0) {
    return agentErr(404, 'not_found', 'member not found or is pod owner');
  }
  return agentOk({userId: parsed.value.userId});
}

export async function listAgentPodJoinRequests(request: Request, input: unknown): Promise<AgentResult<{readonly requests: readonly unknown[]}>> {
  const parsed = safeParseSchema(agentPodIdSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.GROUP,
    action: ApiKeyAction.READ,
    groupTarget: 'podJoin',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const requests = await ctx.data.supabase
    .from('pod_join_request')
    .select('id, pod_id, user_id, status, profile:profile(username)')
    .eq('pod_id', parsed.value.podId)
    .eq('status', 'pending');
  const requestsErr = dbErr(requests.error);
  if (requestsErr !== undefined) {
    return requestsErr;
  }
  const rows = (requests.data ?? []) as unknown as readonly {
    readonly id: string;
    readonly user_id: string;
    readonly status: string;
    readonly profile: {readonly username: string | null} | null;
  }[];
  return agentOk({
    requests: rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      status: row.status,
      username: row.profile?.username ?? undefined,
    })),
  });
}

async function loadPendingRequest(ctx: AgentContext, podId: string, requestId: string): Promise<AgentResult<{readonly userId: string}>> {
  const row = await ctx.supabase.from('pod_join_request').select('id, pod_id, user_id, status').eq('id', requestId).maybeSingle();
  const rowErr = dbErr(row.error);
  if (rowErr !== undefined) {
    return rowErr;
  }
  if (row.data === null || row.data.pod_id !== podId) {
    return agentErr(404, 'not_found', 'request not found');
  }
  if (row.data.status !== 'pending') {
    return agentErr(400, 'validation', 'request is not pending');
  }
  return agentOk({userId: row.data.user_id});
}

export async function approveAgentPodJoinRequest(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentPodJoinRequestSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.GROUP,
    action: ApiKeyAction.UPDATE,
    groupTarget: 'podJoin',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const pending = await loadPendingRequest(ctx.data, parsed.value.podId, parsed.value.requestId);
  if (!pending.ok) {
    return pending;
  }
  const member = await ctx.data.supabase.from('pod_member').upsert(
    {pod_id: parsed.value.podId, user_id: pending.data.userId, role: PodRole.USER},
    {onConflict: 'pod_id,user_id', ignoreDuplicates: true},
  );
  const memberErr = dbErr(member.error);
  if (memberErr !== undefined) {
    return memberErr;
  }
  const updated = await ctx.data.supabase
    .from('pod_join_request')
    .update({status: 'approved', resolved_at: ctx.data.nowIso})
    .eq('id', parsed.value.requestId);
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  return agentOk({id: parsed.value.requestId});
}

export async function denyAgentPodJoinRequest(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentPodJoinRequestSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.GROUP,
    action: ApiKeyAction.UPDATE,
    groupTarget: 'podJoin',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const pending = await loadPendingRequest(ctx.data, parsed.value.podId, parsed.value.requestId);
  if (!pending.ok) {
    return pending;
  }
  const updated = await ctx.data.supabase
    .from('pod_join_request')
    .update({status: 'denied', resolved_at: ctx.data.nowIso})
    .eq('id', parsed.value.requestId);
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  return agentOk({id: parsed.value.requestId});
}
