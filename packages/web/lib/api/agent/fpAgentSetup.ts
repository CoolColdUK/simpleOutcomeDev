import {
  agentFpImportCreateSchema,
  agentFpImportIdSchema,
  agentFpParserWriteSchema,
  agentFpSettingSchema,
  agentPodIdSchema,
  ApiKeyAction,
  ApiKeyResource,
  FpResource,
  parseFpCurrency,
  parseFpPermissionMatrix,
  safeParseSchema,
} from '@so/model';
import {agentErr, agentOk, agentValidation, dbErr, rpcErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {mapDbFpImport} from '@/lib/api/db/mapDbFpImport';
import {mapDbFpImportFile} from '@/lib/api/db/mapDbFpImportFile';
import {mapDbFpParser} from '@/lib/api/db/mapDbFpParser';
import {mapDbFpSetting} from '@/lib/api/db/mapDbFpSetting';

function fpCall(podId: string, action: ApiKeyAction, fpResource: FpResource) {
  return {podId, resource: ApiKeyResource.FP, action, fpResource};
}

export async function listAgentFpParsers(request: Request, input: unknown): Promise<AgentResult<{readonly parsers: readonly unknown[]}>> {
  const parsed = safeParseSchema(agentPodIdSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.READ, FpResource.PARSER));
  if (!ctx.ok) {
    return ctx;
  }
  const rows = await ctx.data.supabase
    .from('fp_parser')
    .select('id, pod_id, name, identifier, has_header, skip_rows, delimiter, column_map')
    .eq('pod_id', parsed.value.podId)
    .order('name', {ascending: true});
  const rowsErr = dbErr(rows.error);
  if (rowsErr !== undefined) {
    return rowsErr;
  }
  return agentOk({parsers: (rows.data ?? []).map(mapDbFpParser)});
}

export async function createAgentFpParser(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentFpParserWriteSchema, input);
  if (!parsed.ok || parsed.value.name === undefined || parsed.value.columnMap === undefined) {
    return agentValidation(parsed.ok ? 'Name and column map are required' : parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.CREATE, FpResource.PARSER));
  if (!ctx.ok) {
    return ctx;
  }
  const inserted = await ctx.data.supabase
    .from('fp_parser')
    .insert({
      pod_id: parsed.value.podId,
      name: parsed.value.name,
      column_map: parsed.value.columnMap,
      identifier: parsed.value.identifier ?? null,
      has_header: parsed.value.hasHeader ?? true,
      skip_rows: parsed.value.skipRows ?? 0,
      delimiter: parsed.value.delimiter ?? ',',
    })
    .select('id')
    .single();
  const insertedErr = dbErr(inserted.error);
  if (insertedErr !== undefined || inserted.data === null) {
    return insertedErr ?? agentErr(500, 'error', 'Request failed');
  }
  return agentOk({id: inserted.data.id});
}

export async function updateAgentFpParser(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentFpParserWriteSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const parserId = parsed.value.parserId;
  if (parserId === undefined) {
    return agentValidation('Parser is required');
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.UPDATE, FpResource.PARSER));
  if (!ctx.ok) {
    return ctx;
  }
  const value = parsed.value;
  const patch = {
    ...(value.name === undefined ? {} : {name: value.name}),
    ...(value.identifier === undefined ? {} : {identifier: value.identifier === null || value.identifier === '' ? null : value.identifier}),
    ...(value.hasHeader === undefined ? {} : {has_header: value.hasHeader}),
    ...(value.skipRows === undefined ? {} : {skip_rows: value.skipRows}),
    ...(value.delimiter === undefined ? {} : {delimiter: value.delimiter}),
    ...(value.columnMap === undefined ? {} : {column_map: value.columnMap}),
  };
  const updated = await ctx.data.supabase.from('fp_parser').update(patch).eq('id', parserId).eq('pod_id', value.podId).select('id');
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  if ((updated.data ?? []).length === 0) {
    return agentErr(404, 'not_found', 'Not found');
  }
  return agentOk({id: parserId});
}

export async function deleteAgentFpParser(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentFpParserWriteSchema, input);
  if (!parsed.ok || parsed.value.parserId === undefined) {
    return agentValidation(parsed.ok ? 'Parser is required' : parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.DELETE, FpResource.PARSER));
  if (!ctx.ok) {
    return ctx;
  }
  const removed = await ctx.data.supabase.from('fp_parser').delete().eq('id', parsed.value.parserId).eq('pod_id', parsed.value.podId).select('id');
  const removedErr = dbErr(removed.error);
  if (removedErr !== undefined) {
    return removedErr;
  }
  if ((removed.data ?? []).length === 0) {
    return agentErr(404, 'not_found', 'Not found');
  }
  return agentOk({id: parsed.value.parserId});
}

export async function listAgentFpImports(request: Request, input: unknown): Promise<AgentResult<{readonly imports: readonly unknown[]}>> {
  const parsed = safeParseSchema(agentPodIdSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.READ, FpResource.IMPORT));
  if (!ctx.ok) {
    return ctx;
  }
  const rows = await ctx.data.supabase
    .from('fp_import')
    .select('id, pod_id, parser_id, account_id, created_at, undone_at')
    .eq('pod_id', parsed.value.podId)
    .order('created_at', {ascending: false});
  const rowsErr = dbErr(rows.error);
  if (rowsErr !== undefined) {
    return rowsErr;
  }
  return agentOk({imports: (rows.data ?? []).map(mapDbFpImport)});
}

export async function listAgentFpImportFiles(request: Request, input: unknown): Promise<AgentResult<{readonly files: readonly unknown[]}>> {
  const parsed = safeParseSchema(agentPodIdSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.READ, FpResource.IMPORT));
  if (!ctx.ok) {
    return ctx;
  }
  const rows = await ctx.data.supabase
    .from('fp_import_file')
    .select('id, import_id, file_name, content_sha256, parsed, created_count, duplicate_skipped, failed, errors')
    .eq('pod_id', parsed.value.podId);
  const rowsErr = dbErr(rows.error);
  if (rowsErr !== undefined) {
    return rowsErr;
  }
  return agentOk({files: (rows.data ?? []).map(mapDbFpImportFile)});
}

export async function hasAgentFpImportHash(request: Request, input: unknown): Promise<AgentResult<{readonly exists: boolean}>> {
  const parsed = safeParseSchema(agentFpImportIdSchema, input);
  if (!parsed.ok || parsed.value.sha256 === undefined) {
    return agentValidation(parsed.ok ? 'Hash is required' : parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.READ, FpResource.IMPORT));
  if (!ctx.ok) {
    return ctx;
  }
  const [files, imports] = await Promise.all([
    ctx.data.supabase.from('fp_import_file').select('import_id, content_sha256').eq('pod_id', parsed.value.podId).eq('content_sha256', parsed.value.sha256),
    ctx.data.supabase.from('fp_import').select('id, undone_at').eq('pod_id', parsed.value.podId).is('undone_at', null),
  ]);
  const filesErr = dbErr(files.error);
  if (filesErr !== undefined) {
    return filesErr;
  }
  const importsErr = dbErr(imports.error);
  if (importsErr !== undefined) {
    return importsErr;
  }
  const active = new Set((imports.data ?? []).map((row) => row.id));
  return agentOk({exists: (files.data ?? []).some((file) => active.has(file.import_id))});
}

export async function createAgentFpImport(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentFpImportCreateSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.CREATE, FpResource.IMPORT));
  if (!ctx.ok) {
    return ctx;
  }
  const files = parsed.value.files.map((file) => ({
    file_name: file.fileName,
    content_sha256: file.contentSha256,
    parsed: file.parsed,
    logs: (file.logs ?? []).map((log) => ({
      kind: log.kind,
      rowIndex: log.rowIndex,
      message: log.message,
      ...(log.fileLine === undefined ? {} : {fileLine: log.fileLine}),
      ...(log.raw === undefined ? {} : {raw: log.raw}),
    })),
    rows: file.rows.map((row) => ({
      posted_date: row.postedDate,
      posted_time: row.postedTime ?? '',
      amount: String(row.amount),
      description: row.description ?? '',
      recipient: row.recipient ?? '',
      external_id: row.externalId ?? '',
      notes: row.notes ?? '',
      row_index: row.rowIndex,
      ...(row.fileLine === undefined ? {} : {file_line: row.fileLine}),
    })),
  }));
  const created = await ctx.data.supabase.rpc('create_agent_fp_import', {
    p_actor: ctx.data.record.ownerUserId,
    p_pod_id: parsed.value.podId,
    p_parser_id: parsed.value.parserId ?? null,
    p_account_id: parsed.value.accountId,
    p_files: files,
  });
  const createdErr = rpcErr(created.error);
  if (createdErr !== undefined || created.data === null) {
    return createdErr ?? agentErr(500, 'error', 'Request failed');
  }
  return agentOk({id: created.data});
}

export async function undoAgentFpImport(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentFpImportIdSchema, input);
  if (!parsed.ok || parsed.value.importId === undefined) {
    return agentValidation(parsed.ok ? 'Import is required' : parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.DELETE, FpResource.IMPORT));
  if (!ctx.ok) {
    return ctx;
  }
  const undone = await ctx.data.supabase.rpc('undo_agent_fp_import', {
    p_pod_id: parsed.value.podId,
    p_import_id: parsed.value.importId,
  });
  const undoneErr = rpcErr(undone.error);
  if (undoneErr !== undefined) {
    return undoneErr;
  }
  return agentOk({id: parsed.value.importId});
}

export async function getAgentFpSetting(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const parsed = safeParseSchema(agentPodIdSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.READ, FpResource.SETTINGS));
  if (!ctx.ok) {
    return ctx;
  }
  const row = await ctx.data.supabase.from('fp_setting').select('pod_id, currency, permission').eq('pod_id', parsed.value.podId).maybeSingle();
  const rowErr = dbErr(row.error);
  if (rowErr !== undefined) {
    return rowErr;
  }
  if (row.data === null) {
    return agentErr(404, 'not_found', 'Not found');
  }
  return agentOk(mapDbFpSetting(row.data));
}

export async function updateAgentFpSetting(request: Request, input: unknown): Promise<AgentResult<{readonly podId: string}>> {
  const parsed = safeParseSchema(agentFpSettingSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.UPDATE, FpResource.SETTINGS));
  if (!ctx.ok) {
    return ctx;
  }
  const currency = parsed.value.currency === undefined ? undefined : safeCurrency(parsed.value.currency);
  if (parsed.value.currency !== undefined && currency === undefined) {
    return agentValidation('Invalid currency');
  }
  const permission = parsed.value.permission === undefined ? undefined : safePermission(parsed.value.permission);
  if (parsed.value.permission !== undefined && permission === undefined) {
    return agentValidation('Invalid permission matrix');
  }
  const patch = {
    ...(currency === undefined ? {} : {currency}),
    ...(permission === undefined ? {} : {permission}),
  };
  const updated = await ctx.data.supabase.from('fp_setting').update(patch).eq('pod_id', parsed.value.podId).select('pod_id');
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  if ((updated.data ?? []).length === 0) {
    return agentErr(404, 'not_found', 'Not found');
  }
  return agentOk({podId: parsed.value.podId});
}

function safeCurrency(value: string): string | undefined {
  try {
    return parseFpCurrency(value);
  } catch {
    return undefined;
  }
}

function safePermission(value: Record<string, unknown>): ReturnType<typeof parseFpPermissionMatrix> | undefined {
  try {
    return parseFpPermissionMatrix(value);
  } catch {
    return undefined;
  }
}
