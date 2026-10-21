import {
  type ApiKeyOwnerAccess,
  type ApiKeyPodAccess,
  type ApiKeyRecord,
  type ApiKeyStoredStatus,
  type FeatureKind,
  type PodRole,
  type PodStatus,
  type SpaceRole,
  FeatureKind as FeatureKindEnum,
  PodRole as PodRoleEnum,
  PodStatus as PodStatusEnum,
  SpaceRole as SpaceRoleEnum,
  apiKeyAuthzHttpStatus,
  authorizeApiKeyCall,
  deriveApiKeyStatus,
  parseApiKeySecret,
  safeParseApiKeyPermissions,
  type ApiKeyCall,
  ApiKeyStatus,
  parseFpPermissionMatrix,
} from '@so/model';
import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseServiceClient from '@/lib/supabase/getSupabaseServiceClient';
import type {Database} from '@/lib/supabase/database';
import {agentErr, agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import apiKeySecretHashMatches from '@/lib/api/agent/apiKeySecretHash';
import readBearerToken from '@/lib/api/agent/readBearerToken';

export interface AgentContext {
  readonly supabase: SupabaseClient<Database>;
  readonly record: ApiKeyRecord;
  readonly access: ApiKeyOwnerAccess;
  readonly nowIso: string;
  readonly keyName: string;
  readonly keyPrefix: string;
}

function enumValue<T extends string>(values: readonly T[], input: string): T | undefined {
  return values.find((value) => value === input);
}

function storedStatus(input: string): ApiKeyStoredStatus | undefined {
  if (input === 'active' || input === 'revoked') {
    return input;
  }
  return undefined;
}

async function loadAccess(
  supabase: SupabaseClient<Database>,
  spaceId: string,
  ownerUserId: string,
): Promise<AgentResult<ApiKeyOwnerAccess>> {
  const member = await supabase.from('space_member').select('role').eq('space_id', spaceId).eq('user_id', ownerUserId).maybeSingle();
  const memberErr = dbErr(member.error);
  if (memberErr !== undefined) {
    return memberErr;
  }
  const pods = await supabase.from('pod').select('id, feature, status, created_by').eq('space_id', spaceId);
  const podsErr = dbErr(pods.error);
  if (podsErr !== undefined) {
    return podsErr;
  }
  const podIds = (pods.data ?? []).map((pod) => pod.id);
  const membership =
    podIds.length === 0
      ? {data: [], error: null}
      : await supabase.from('pod_member').select('pod_id, role').eq('user_id', ownerUserId).in('pod_id', podIds);
  const membershipErr = dbErr(membership.error);
  if (membershipErr !== undefined) {
    return membershipErr;
  }
  const fpIds = (pods.data ?? []).filter((pod) => pod.feature === FeatureKindEnum.FINANCIAL_PLANNING).map((pod) => pod.id);
  const settings =
    fpIds.length === 0
      ? {data: [], error: null}
      : await supabase.from('fp_setting').select('pod_id, permission').in('pod_id', fpIds);
  const settingsErr = dbErr(settings.error);
  if (settingsErr !== undefined) {
    return settingsErr;
  }
  const roleByPod = new Map((membership.data ?? []).map((row) => [row.pod_id, row.role]));
  const permissionByPod = new Map((settings.data ?? []).map((row) => [row.pod_id, row.permission]));
  const accessPods = (pods.data ?? []).flatMap((row): readonly ApiKeyPodAccess[] => {
    const feature = enumValue(Object.values(FeatureKindEnum), row.feature);
    const status = enumValue(Object.values(PodStatusEnum), row.status);
    if (feature === undefined || status === undefined) {
      return [];
    }
    const role = enumValue(Object.values(PodRoleEnum), roleByPod.get(row.id) ?? '');
    return [
      {
        id: row.id,
        feature: feature as FeatureKind,
        status: status as PodStatus,
        createdBy: row.created_by,
        role: role as PodRole | undefined,
        fpPermission: feature === FeatureKindEnum.FINANCIAL_PLANNING ? parseFpPermissionMatrix(permissionByPod.get(row.id)) : undefined,
      },
    ];
  });
  const spaceRole = enumValue(Object.values(SpaceRoleEnum), member.data?.role ?? '');
  return agentOk({
    spaceRole: spaceRole as SpaceRole | undefined,
    pods: accessPods,
  });
}

export default async function loadAgentContext(request: Request): Promise<AgentResult<AgentContext>> {
  const token = readBearerToken(request);
  if (token === undefined) {
    return agentErr(401, 'unauthorized', 'API key is required');
  }
  const parsedSecret = parseApiKeySecret(token);
  if (parsedSecret === undefined) {
    return agentErr(401, 'unauthorized', 'Invalid API key');
  }
  const supabase = getSupabaseServiceClient();
  if (supabase === undefined) {
    return agentErr(503, 'unavailable', 'API key routes are not configured');
  }
  const found = await supabase
    .from('api_key')
    .select('id, space_id, owner_user_id, name, key_prefix, secret_hash, pod_ids, permissions, status, expires_at')
    .eq('key_prefix', parsedSecret.prefix)
    .maybeSingle();
  const foundErr = dbErr(found.error);
  if (foundErr !== undefined) {
    return foundErr;
  }
  const row = found.data;
  const hash = row?.secret_hash ?? '0'.repeat(64);
  if (row === null || row === undefined || !apiKeySecretHashMatches(parsedSecret.secret, hash)) {
    return agentErr(401, 'unauthorized', 'Invalid API key');
  }
  const status = storedStatus(row.status);
  if (status === undefined) {
    return agentErr(401, 'unauthorized', 'Invalid API key');
  }
  const permissions = safeParseApiKeyPermissions(row.permissions, row.pod_ids ?? []);
  if (!permissions.ok) {
    return agentErr(403, 'forbidden', 'API key permissions are invalid');
  }
  const nowIso = new Date().toISOString();
  const derived = deriveApiKeyStatus(status, row.expires_at ?? undefined, nowIso);
  if (derived === ApiKeyStatus.REVOKED) {
    return agentErr(401, 'revoked', 'API key is revoked');
  }
  if (derived === ApiKeyStatus.EXPIRED) {
    return agentErr(401, 'expired', 'API key is expired');
  }
  const touched = await supabase.from('api_key').update({last_used_at: nowIso}).eq('id', row.id);
  const touchedErr = dbErr(touched.error);
  if (touchedErr !== undefined) {
    return touchedErr;
  }
  const access = await loadAccess(supabase, row.space_id, row.owner_user_id);
  if (!access.ok) {
    return access;
  }
  if (access.data.spaceRole === undefined) {
    return agentErr(403, 'forbidden', 'API key owner is not a member of this space');
  }
  const record: ApiKeyRecord = {
    id: row.id,
    spaceId: row.space_id,
    ownerUserId: row.owner_user_id,
    status,
    expiresAt: row.expires_at ?? undefined,
    podIds: row.pod_ids ?? [],
    permissions: permissions.value,
  };
  return agentOk({
    supabase,
    record,
    access: access.data,
    nowIso,
    keyName: row.name,
    keyPrefix: row.key_prefix,
  });
}

function authorizeLoaded(ctx: AgentContext, call: ApiKeyCall): AgentResult<AgentContext> {
  const auth = authorizeApiKeyCall({key: ctx.record, access: ctx.access, call, nowIso: ctx.nowIso});
  if (!auth.ok) {
    return agentErr(apiKeyAuthzHttpStatus(auth.code), auth.code, auth.message);
  }
  return agentOk(ctx);
}

export async function requireAgentCall(request: Request, call: ApiKeyCall): Promise<AgentResult<AgentContext>> {
  const ctx = await loadAgentContext(request);
  if (!ctx.ok) {
    return ctx;
  }
  return authorizeLoaded(ctx.data, call);
}

export async function requirePodAgent(request: Request, call: Omit<ApiKeyCall, 'spaceId'>): Promise<AgentResult<AgentContext>> {
  const ctx = await loadAgentContext(request);
  if (!ctx.ok) {
    return ctx;
  }
  return authorizeLoaded(ctx.data, {...call, spaceId: ctx.data.record.spaceId});
}
