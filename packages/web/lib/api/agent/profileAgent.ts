import {agentProfileDisplayNameSchema, agentProfileUsernameSchema, ApiKeyAction, canChangeUsername, safeParseSchema} from '@so/model';
import {agentErr, agentOk, agentValidation, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requireProfileAgent} from '@/lib/api/agent/loadAgentContext';

export async function getAgentProfile(request: Request): Promise<AgentResult<unknown>> {
  const ctx = await requireProfileAgent(request, ApiKeyAction.READ);
  if (!ctx.ok) {
    return ctx;
  }
  const profile = await ctx.data.supabase
    .from('profile')
    .select('id, username, display_name, username_changed_at')
    .eq('id', ctx.data.record.ownerUserId)
    .maybeSingle();
  const profileErr = dbErr(profile.error);
  if (profileErr !== undefined) {
    return profileErr;
  }
  if (profile.data === null) {
    return agentErr(404, 'not_found', 'Profile not found');
  }
  return agentOk({
    id: profile.data.id,
    username: profile.data.username ?? undefined,
    displayName: profile.data.display_name ?? undefined,
    usernameChangedAt: profile.data.username_changed_at ?? undefined,
  });
}

export async function updateAgentProfileDisplayName(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentProfileDisplayNameSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requireProfileAgent(request, ApiKeyAction.UPDATE);
  if (!ctx.ok) {
    return ctx;
  }
  const displayName = parsed.value.displayName.trim();
  const updated = await ctx.data.supabase
    .from('profile')
    .update({display_name: displayName === '' ? null : displayName, updated_at: ctx.data.nowIso})
    .eq('id', ctx.data.record.ownerUserId)
    .select('id');
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  if ((updated.data ?? []).length === 0) {
    return agentErr(404, 'not_found', 'Profile not found');
  }
  return agentOk({id: ctx.data.record.ownerUserId});
}

export async function updateAgentProfileUsername(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentProfileUsernameSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requireProfileAgent(request, ApiKeyAction.UPDATE);
  if (!ctx.ok) {
    return ctx;
  }
  const current = await ctx.data.supabase
    .from('profile')
    .select('username, username_changed_at')
    .eq('id', ctx.data.record.ownerUserId)
    .maybeSingle();
  const currentErr = dbErr(current.error);
  if (currentErr !== undefined) {
    return currentErr;
  }
  if (current.data === null) {
    return agentErr(404, 'not_found', 'Profile not found');
  }
  if (current.data.username !== null && current.data.username.toLowerCase() === parsed.value.username.toLowerCase()) {
    return agentOk({id: ctx.data.record.ownerUserId});
  }
  if (
    current.data.username !== null &&
    !canChangeUsername(current.data.username_changed_at ?? undefined, ctx.data.nowIso)
  ) {
    return agentErr(400, 'validation', 'username can only be changed once every 30 days');
  }
  const updated = await ctx.data.supabase
    .from('profile')
    .update({
      username: parsed.value.username,
      username_normalized: parsed.value.username.toLowerCase(),
      username_changed_at: ctx.data.nowIso,
      updated_at: ctx.data.nowIso,
    })
    .eq('id', ctx.data.record.ownerUserId);
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    if (updated.error?.message.toLowerCase().includes('duplicate') === true || updated.error?.message.toLowerCase().includes('unique') === true) {
      return agentErr(400, 'validation', 'username is already taken');
    }
    return updatedErr;
  }
  return agentOk({id: ctx.data.record.ownerUserId});
}
