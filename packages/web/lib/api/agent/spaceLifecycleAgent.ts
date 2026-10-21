import {
  agentPodCreateSchema,
  agentPodIdSchema,
  agentPodSearchSchema,
  agentPodStatusSchema,
  agentPodUpdateSchema,
  agentSpaceCreateSchema,
  agentSpaceJoinSchema,
  ApiKeyAction,
  ApiKeyResource,
  PodStatus,
  PodVisibility,
  safeParseSchema,
  type FeatureKind,
  type PodVisibility as PodVisibilityType,
} from '@so/model';
import {agentErr, agentOk, agentValidation, dbErr, rpcErr, type AgentResult} from '@/lib/api/agent/agentResult';
import loadAgentContext, {requireAgentCall, requirePodAgent} from '@/lib/api/agent/loadAgentContext';

function blankToNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null || value.trim() === '') {
    return null;
  }
  return value.trim();
}

function searchText(query: string | undefined): string {
  return (query ?? '').trim().replace(/[%_,.()]/g, '');
}

export async function listAgentSpaces(request: Request): Promise<AgentResult<{readonly spaces: readonly unknown[]}>> {
  const ctx = await loadAgentContext(request);
  if (!ctx.ok) {
    return ctx;
  }
  const members = await ctx.data.supabase
    .from('space_member')
    .select('role, space:space(id, name, description)')
    .eq('user_id', ctx.data.record.ownerUserId);
  const membersErr = dbErr(members.error);
  if (membersErr !== undefined) {
    return membersErr;
  }
  const rows = (members.data ?? []) as unknown as readonly {
    readonly role: string;
    readonly space: {readonly id: string; readonly name: string; readonly description: string | null} | null;
  }[];
  return agentOk({
    spaces: rows.flatMap((row) =>
      row.space === null
        ? []
        : [{id: row.space.id, name: row.space.name, description: row.space.description ?? undefined, role: row.role}],
    ),
  });
}

export async function createAgentSpace(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentSpaceCreateSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await loadAgentContext(request);
  if (!ctx.ok) {
    return ctx;
  }
  const created = await ctx.data.supabase.rpc('create_agent_space', {
    p_actor: ctx.data.record.ownerUserId,
    p_name: parsed.value.name,
    p_description: parsed.value.description ?? '',
  });
  const createdErr = rpcErr(created.error);
  if (createdErr !== undefined || created.data === null) {
    return createdErr ?? agentErr(500, 'error', 'Request failed');
  }
  return agentOk({id: created.data});
}

export async function joinAgentSpaceByInvite(request: Request, input: unknown): Promise<AgentResult<{readonly spaceId: string}>> {
  const parsed = safeParseSchema(agentSpaceJoinSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await loadAgentContext(request);
  if (!ctx.ok) {
    return ctx;
  }
  const joined = await ctx.data.supabase.rpc('join_agent_space_with_invite', {
    p_actor: ctx.data.record.ownerUserId,
    p_token: parsed.value.token,
  });
  const joinedErr = rpcErr(joined.error);
  if (joinedErr !== undefined || joined.data === null) {
    return joinedErr ?? agentErr(500, 'error', 'Request failed');
  }
  return agentOk({spaceId: joined.data});
}

export async function createAgentPod(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentPodCreateSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requireAgentCall(request, {
    spaceId: parsed.value.spaceId,
    resource: ApiKeyResource.SPACE,
    action: ApiKeyAction.CREATE,
  });
  if (!ctx.ok) {
    return ctx;
  }
  const created = await ctx.data.supabase.rpc('create_agent_pod', {
    p_actor: ctx.data.record.ownerUserId,
    p_space_id: parsed.value.spaceId,
    p_feature: parsed.value.feature,
    p_name: parsed.value.name,
    p_visibility: parsed.value.visibility,
    p_description: parsed.value.description ?? '',
  });
  const createdErr = rpcErr(created.error);
  if (createdErr !== undefined || created.data === null) {
    return createdErr ?? agentErr(500, 'error', 'Request failed');
  }
  return agentOk({id: created.data});
}

export async function updateAgentPod(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentPodUpdateSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.SPACE,
    action: ApiKeyAction.UPDATE,
    spaceTarget: 'pod',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const updated = await ctx.data.supabase
    .from('pod')
    .update({
      name: parsed.value.name,
      visibility: parsed.value.visibility,
      description: blankToNull(parsed.value.description),
      updated_at: ctx.data.nowIso,
    })
    .eq('id', parsed.value.podId)
    .select('id');
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  if ((updated.data ?? []).length === 0) {
    return agentErr(404, 'not_found', 'Pod not found');
  }
  return agentOk({id: parsed.value.podId});
}

export async function setAgentPodStatus(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentPodStatusSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.SPACE,
    action: ApiKeyAction.UPDATE,
    spaceTarget: 'pod',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const updated = await ctx.data.supabase
    .from('pod')
    .update({status: parsed.value.status, updated_at: ctx.data.nowIso})
    .eq('id', parsed.value.podId)
    .select('id');
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  if ((updated.data ?? []).length === 0) {
    return agentErr(404, 'not_found', 'Pod not found');
  }
  return agentOk({id: parsed.value.podId});
}

export async function deleteAgentPod(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentPodIdSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.SPACE,
    action: ApiKeyAction.DELETE,
    spaceTarget: 'pod',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const removed = await ctx.data.supabase.from('pod').delete().eq('id', parsed.value.podId).select('id');
  const removedErr = dbErr(removed.error);
  if (removedErr !== undefined) {
    return removedErr;
  }
  if ((removed.data ?? []).length === 0) {
    return agentErr(404, 'not_found', 'Pod not found');
  }
  return agentOk({id: parsed.value.podId});
}

export async function searchAgentPods(request: Request, input: unknown): Promise<AgentResult<{readonly pods: readonly unknown[]}>> {
  const parsed = safeParseSchema(agentPodSearchSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requireAgentCall(request, {
    spaceId: parsed.value.spaceId,
    resource: ApiKeyResource.SPACE,
    action: ApiKeyAction.READ,
    spaceTarget: 'find',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const safe = searchText(parsed.value.query);
  if ((parsed.value.query ?? '').trim() !== '' && safe === '') {
    return agentOk({pods: []});
  }
  const requestRows = ctx.data.supabase
    .from('pod')
    .select('id, feature, name, visibility, status')
    .eq('space_id', parsed.value.spaceId)
    .eq('status', PodStatus.ACTIVE)
    .in('visibility', [PodVisibility.OPEN, PodVisibility.REQUEST]);
  const filtered = safe === '' ? requestRows : requestRows.or(`name.ilike.%${safe}%,feature.ilike.%${safe}%`);
  const pods = await filtered;
  const podsErr = dbErr(pods.error);
  if (podsErr !== undefined) {
    return podsErr;
  }
  return agentOk({
    pods: (pods.data ?? []).map((pod) => ({
      id: pod.id,
      feature: pod.feature as FeatureKind,
      name: pod.name ?? undefined,
      visibility: pod.visibility as PodVisibilityType,
    })),
  });
}

async function podSpaceId(request: Request, podId: string, given: string | undefined): Promise<AgentResult<string>> {
  if (given !== undefined) {
    return agentOk(given);
  }
  const key = await loadAgentContext(request);
  if (!key.ok) {
    return key;
  }
  const pod = await key.data.supabase.from('pod').select('space_id').eq('id', podId).maybeSingle();
  const podErr = dbErr(pod.error);
  if (podErr !== undefined) {
    return podErr;
  }
  if (pod.data === null) {
    return agentErr(404, 'not_found', 'Pod not found');
  }
  return agentOk(pod.data.space_id);
}

export async function joinAgentOpenPod(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentPodIdSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const spaceId = await podSpaceId(request, parsed.value.podId, parsed.value.spaceId);
  if (!spaceId.ok) {
    return spaceId;
  }
  const ctx = await requireAgentCall(request, {
    spaceId: spaceId.data,
    podId: parsed.value.podId,
    resource: ApiKeyResource.SPACE,
    action: ApiKeyAction.READ,
    spaceTarget: 'find',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const pod = await ctx.data.supabase.from('pod').select('id, space_id, status, visibility').eq('id', parsed.value.podId).maybeSingle();
  const podErr = dbErr(pod.error);
  if (podErr !== undefined) {
    return podErr;
  }
  if (pod.data === null || pod.data.space_id !== spaceId.data) {
    return agentErr(404, 'not_found', 'Pod not found');
  }
  if (pod.data.status !== PodStatus.ACTIVE || pod.data.visibility !== PodVisibility.OPEN) {
    return agentErr(400, 'validation', 'pod is not open');
  }
  const joined = await ctx.data.supabase.from('pod_member').upsert(
    {pod_id: parsed.value.podId, user_id: ctx.data.record.ownerUserId, role: 'pod_user'},
    {onConflict: 'pod_id,user_id', ignoreDuplicates: true},
  );
  const joinedErr = dbErr(joined.error);
  if (joinedErr !== undefined) {
    return joinedErr;
  }
  return agentOk({id: parsed.value.podId});
}

export async function createAgentPodJoinRequest(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentPodIdSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const spaceId = await podSpaceId(request, parsed.value.podId, parsed.value.spaceId);
  if (!spaceId.ok) {
    return spaceId;
  }
  const ctx = await requireAgentCall(request, {
    spaceId: spaceId.data,
    podId: parsed.value.podId,
    resource: ApiKeyResource.SPACE,
    action: ApiKeyAction.READ,
    spaceTarget: 'find',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const pod = await ctx.data.supabase.from('pod').select('id, space_id, status, visibility').eq('id', parsed.value.podId).maybeSingle();
  const podErr = dbErr(pod.error);
  if (podErr !== undefined) {
    return podErr;
  }
  if (pod.data === null || pod.data.space_id !== spaceId.data) {
    return agentErr(404, 'not_found', 'Pod not found');
  }
  if (pod.data.status !== PodStatus.ACTIVE || pod.data.visibility !== PodVisibility.REQUEST) {
    return agentErr(400, 'validation', 'pod does not accept requests');
  }
  const member = await ctx.data.supabase
    .from('pod_member')
    .select('user_id')
    .eq('pod_id', parsed.value.podId)
    .eq('user_id', ctx.data.record.ownerUserId)
    .maybeSingle();
  const memberErr = dbErr(member.error);
  if (memberErr !== undefined) {
    return memberErr;
  }
  if (member.data !== null) {
    return agentErr(400, 'validation', 'already a member');
  }
  const existing = await ctx.data.supabase
    .from('pod_join_request')
    .select('id, status')
    .eq('pod_id', parsed.value.podId)
    .eq('user_id', ctx.data.record.ownerUserId)
    .maybeSingle();
  const existingErr = dbErr(existing.error);
  if (existingErr !== undefined) {
    return existingErr;
  }
  if (existing.data?.status === 'denied') {
    const revived = await ctx.data.supabase
      .from('pod_join_request')
      .update({status: 'pending', resolved_at: null})
      .eq('id', existing.data.id)
      .select('id')
      .single();
    const revivedErr = dbErr(revived.error);
    if (revivedErr !== undefined || revived.data === null) {
      return revivedErr ?? agentErr(500, 'error', 'Request failed');
    }
    return agentOk({id: revived.data.id});
  }
  if (existing.data !== null) {
    return agentOk({id: existing.data.id});
  }
  const inserted = await ctx.data.supabase
    .from('pod_join_request')
    .insert({pod_id: parsed.value.podId, user_id: ctx.data.record.ownerUserId, status: 'pending'})
    .select('id')
    .single();
  const insertedErr = dbErr(inserted.error);
  if (insertedErr !== undefined || inserted.data === null) {
    return insertedErr ?? agentErr(500, 'error', 'Request failed');
  }
  return agentOk({id: inserted.data.id});
}
