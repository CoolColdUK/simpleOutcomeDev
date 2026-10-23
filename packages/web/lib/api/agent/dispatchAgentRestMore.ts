import {agentResultResponse} from '@/lib/api/agent/agentResult';
import {
  addAgentPodMemberByUsername,
  approveAgentPodJoinRequest,
  denyAgentPodJoinRequest,
  disableAgentSpaceInvite,
  listAgentPodJoinRequests,
  listAgentPodMembers,
  updateAgentPodMemberRole,
} from '@/lib/api/agent/groupPodAgent';
import {createAgentFpAccount, createAgentFpCategory, deleteAgentFpAccount, deleteAgentFpCategory, listAgentFpAccounts, listAgentFpCategories, updateAgentFpAccount, updateAgentFpCategory} from '@/lib/api/agent/fpAgentLedger';
import {
  applyAgentFpAutoAssign,
  assignAgentFpTransactionCategory,
  bulkAssignAgentFpTransactionCategory,
  confirmAgentFpTransactions,
  createAgentFpBillSplit,
  createAgentFpTransaction,
  deleteAgentFpBillSplit,
  deleteAgentFpTransaction,
  deleteAllAgentFpTransactions,
  listAgentFpTransactions,
  previewAgentFpAutoAssign,
  updateAgentFpTransaction,
} from '@/lib/api/agent/fpAgentTransactions';
import {
  createAgentFpImport,
  createAgentFpParser,
  deleteAgentFpParser,
  getAgentFpSetting,
  hasAgentFpImportHash,
  listAgentFpImportFiles,
  listAgentFpImports,
  listAgentFpParsers,
  undoAgentFpImport,
  updateAgentFpParser,
  updateAgentFpSetting,
} from '@/lib/api/agent/fpAgentSetup';
import {getAgentProfile, updateAgentProfileDisplayName, updateAgentProfileUsername} from '@/lib/api/agent/profileAgent';
import {getAgentTpBudgetRollup, getAgentTpWorkspace, updateAgentTpTrip} from '@/lib/api/agent/tpAgentWorkspace';
import {createAgentTpDestination, deleteAgentTpDestination, updateAgentTpDestination} from '@/lib/api/agent/tpAgentDestinations';
import {updateAgentTpDay} from '@/lib/api/agent/tpAgentDays';
import {createAgentTpAction, deleteAgentTpAction, updateAgentTpAction} from '@/lib/api/agent/tpAgentActions';
import {createAgentTpRoute, deleteAgentTpRoute, selectAgentTpRoute, updateAgentTpRoute} from '@/lib/api/agent/tpAgentRoutes';
import {createAgentTpTransport, deleteAgentTpTransport, updateAgentTpTransport} from '@/lib/api/agent/tpAgentTransports';
import {deleteAgentTpAttachment, listAgentTpAttachments, uploadAgentTpAttachment} from '@/lib/api/agent/tpAgentAttachments';
import {
  createAgentPod,
  createAgentPodJoinRequest,
  createAgentSpace,
  deleteAgentPod,
  joinAgentOpenPod,
  joinAgentSpaceByInvite,
  listAgentSpaces,
  searchAgentPods,
  setAgentPodStatus,
  updateAgentPod,
} from '@/lib/api/agent/spaceLifecycleAgent';
import {archiveAgentTodoColumnCards, archiveAgentTodoColumnCompleted, reorderAgentTodoCards, reorderAgentTodoColumns} from '@/lib/api/agent/todoAgentBoard';
import {clearAgentTodoCardIcon, replaceAgentTodoCardIcon} from '@/lib/api/agent/todoAgentIcons';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function methodNotAllowed(): Response {
  return Response.json({error: {code: 'method_not_allowed', message: 'Method not allowed'}}, {status: 405});
}

function isUuid(value: string | undefined): value is string {
  return value !== undefined && UUID.test(value);
}

async function bodyWith(request: Request, ids: Record<string, string>): Promise<unknown> {
  const body = await request.json().catch(() => undefined);
  const base = typeof body === 'object' && body !== null && !Array.isArray(body) ? body : {};
  return {...base, ...ids};
}

function queryInput(request: Request, ids: Record<string, string>): Record<string, unknown> {
  const url = new URL(request.url);
  const limit = url.searchParams.get('limit');
  const offset = url.searchParams.get('offset');
  const query = url.searchParams.get('query') ?? url.searchParams.get('q');
  const sha256 = url.searchParams.get('sha256');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const accountId = url.searchParams.get('accountId');
  const archived = url.searchParams.get('archived');
  return {
    ...ids,
    ...(limit === null || limit === '' ? {} : {limit: Number(limit)}),
    ...(offset === null || offset === '' ? {} : {offset: Number(offset)}),
    ...(query === null || query === '' ? {} : {query}),
    ...(sha256 === null || sha256 === '' ? {} : {sha256}),
    ...(startDate === null || startDate === '' ? {} : {startDate}),
    ...(endDate === null || endDate === '' ? {} : {endDate}),
    ...(accountId === null || accountId === '' ? {} : {accountId}),
    ...(archived === null || archived === '' ? {} : {archived: archived === 'true'}),
  };
}

export default async function dispatchAgentRestMore(method: string, request: Request, path: readonly string[]): Promise<Response | undefined> {
  const [root, id, third, fourth, fifth, sixth] = path;
  if (root === 'spaces' && id === undefined) {
    if (method === 'GET') {
      return agentResultResponse(await listAgentSpaces(request));
    }
    if (method === 'POST') {
      return agentResultResponse(await createAgentSpace(request, await bodyWith(request, {})));
    }
    return methodNotAllowed();
  }
  if (root === 'spaces' && id === 'join' && third === undefined) {
    return method === 'POST' ? agentResultResponse(await joinAgentSpaceByInvite(request, await bodyWith(request, {}))) : methodNotAllowed();
  }
  if (root === 'spaces' && isUuid(id) && third === 'pods' && fourth === undefined && method === 'POST') {
    return agentResultResponse(await createAgentPod(request, await bodyWith(request, {spaceId: id})));
  }
  if (root === 'spaces' && isUuid(id) && third === 'pods' && fourth === 'search') {
    return method === 'GET' ? agentResultResponse(await searchAgentPods(request, queryInput(request, {spaceId: id}))) : methodNotAllowed();
  }
  if (root === 'spaces' && isUuid(id) && third === 'invites' && isUuid(fourth) && fifth === 'disable') {
    return method === 'POST' ? agentResultResponse(await disableAgentSpaceInvite(request, {spaceId: id, inviteId: fourth})) : methodNotAllowed();
  }
  if (root === 'pods' && isUuid(id) && third === undefined) {
    if (method === 'PATCH') {
      return agentResultResponse(await updateAgentPod(request, await bodyWith(request, {podId: id})));
    }
    if (method === 'DELETE') {
      return agentResultResponse(await deleteAgentPod(request, {podId: id}));
    }
    return methodNotAllowed();
  }
  if (root === 'pods' && isUuid(id) && third === 'status' && fourth === undefined) {
    return method === 'POST' ? agentResultResponse(await setAgentPodStatus(request, await bodyWith(request, {podId: id}))) : methodNotAllowed();
  }
  if (root === 'pods' && isUuid(id) && third === 'join' && fourth === undefined) {
    return method === 'POST' ? agentResultResponse(await joinAgentOpenPod(request, {podId: id})) : methodNotAllowed();
  }
  if (root === 'pods' && isUuid(id) && third === 'join-requests' && fourth === undefined) {
    if (method === 'GET') {
      return agentResultResponse(await listAgentPodJoinRequests(request, {podId: id}));
    }
    if (method === 'POST') {
      return agentResultResponse(await createAgentPodJoinRequest(request, {podId: id}));
    }
    return methodNotAllowed();
  }
  if (root === 'pods' && isUuid(id) && third === 'join-requests' && isUuid(fourth) && (fifth === 'approve' || fifth === 'deny')) {
    if (method !== 'POST') {
      return methodNotAllowed();
    }
    const input = {podId: id, requestId: fourth};
    return agentResultResponse(
      await (fifth === 'approve' ? approveAgentPodJoinRequest(request, input) : denyAgentPodJoinRequest(request, input)),
    );
  }
  if (root === 'pods' && isUuid(id) && third === 'members' && fourth === undefined) {
    if (method === 'GET') {
      return agentResultResponse(await listAgentPodMembers(request, {podId: id}));
    }
    if (method === 'POST') {
      return agentResultResponse(await addAgentPodMemberByUsername(request, await bodyWith(request, {podId: id})));
    }
    return methodNotAllowed();
  }
  if (root === 'pods' && isUuid(id) && third === 'members' && isUuid(fourth) && fifth === undefined) {
    return method === 'PATCH'
      ? agentResultResponse(await updateAgentPodMemberRole(request, await bodyWith(request, {podId: id, userId: fourth})))
      : methodNotAllowed();
  }
  if (root === 'profile' && id === undefined) {
    return method === 'GET' ? agentResultResponse(await getAgentProfile(request)) : methodNotAllowed();
  }
  if (root === 'profile' && id === 'display-name' && third === undefined) {
    return method === 'PATCH' ? agentResultResponse(await updateAgentProfileDisplayName(request, await bodyWith(request, {}))) : methodNotAllowed();
  }
  if (root === 'profile' && id === 'username' && third === undefined) {
    return method === 'PATCH' ? agentResultResponse(await updateAgentProfileUsername(request, await bodyWith(request, {}))) : methodNotAllowed();
  }
  if (root === 'pods' && isUuid(id) && third === 'todo' && fourth === 'columns' && fifth === 'reorder') {
    return method === 'POST' ? agentResultResponse(await reorderAgentTodoColumns(request, await bodyWith(request, {podId: id}))) : methodNotAllowed();
  }
  if (root === 'pods' && isUuid(id) && third === 'todo' && fourth === 'cards' && fifth === 'reorder') {
    return method === 'POST' ? agentResultResponse(await reorderAgentTodoCards(request, await bodyWith(request, {podId: id}))) : methodNotAllowed();
  }
  if (root === 'pods' && isUuid(id) && third === 'todo' && fourth === 'columns' && isUuid(fifth) && sixth === 'archive') {
    return method === 'POST' ? agentResultResponse(await archiveAgentTodoColumnCards(request, {podId: id, columnId: fifth})) : methodNotAllowed();
  }
  if (root === 'pods' && isUuid(id) && third === 'todo' && fourth === 'columns' && isUuid(fifth) && sixth === 'archive-completed') {
    return method === 'POST' ? agentResultResponse(await archiveAgentTodoColumnCompleted(request, {podId: id, columnId: fifth})) : methodNotAllowed();
  }
  if (root === 'pods' && isUuid(id) && third === 'todo' && fourth === 'cards' && isUuid(fifth) && sixth === 'icon') {
    if (method === 'POST') {
      return agentResultResponse(await replaceAgentTodoCardIcon(request, await bodyWith(request, {podId: id, cardId: fifth})));
    }
    if (method === 'DELETE') {
      return agentResultResponse(await clearAgentTodoCardIcon(request, {podId: id, cardId: fifth}));
    }
    return methodNotAllowed();
  }
  return (await dispatchTp(method, request, path)) ?? (await dispatchFp(method, request, path));
}

async function dispatchTp(method: string, request: Request, path: readonly string[]): Promise<Response | undefined> {
  const [, id, third, fourth, fifth, sixth] = path;
  if (path[0] !== 'pods' || !isUuid(id) || third !== 'trip') {
    return undefined;
  }
  const podId = id;
  if (fourth === 'workspace' && fifth === undefined) {
    return method === 'GET' ? agentResultResponse(await getAgentTpWorkspace(request, {podId})) : methodNotAllowed();
  }
  if (fourth === undefined && fifth === undefined) {
    return method === 'PATCH' ? agentResultResponse(await updateAgentTpTrip(request, await bodyWith(request, {podId}))) : methodNotAllowed();
  }
  if (fourth === 'budget' && fifth === undefined) {
    return method === 'GET' ? agentResultResponse(await getAgentTpBudgetRollup(request, {podId})) : methodNotAllowed();
  }
  if (fourth === 'destinations' && fifth === undefined) {
    return method === 'POST' ? agentResultResponse(await createAgentTpDestination(request, await bodyWith(request, {podId}))) : methodNotAllowed();
  }
  if (fourth === 'destinations' && isUuid(fifth) && sixth === undefined) {
    if (method === 'PATCH') {
      return agentResultResponse(await updateAgentTpDestination(request, await bodyWith(request, {podId, destinationId: fifth})));
    }
    if (method === 'DELETE') {
      return agentResultResponse(await deleteAgentTpDestination(request, {podId, destinationId: fifth}));
    }
    return methodNotAllowed();
  }
  if (fourth === 'days' && isUuid(fifth) && sixth === undefined) {
    return method === 'PATCH' ? agentResultResponse(await updateAgentTpDay(request, await bodyWith(request, {podId, dayId: fifth}))) : methodNotAllowed();
  }
  if (fourth === 'actions' && fifth === undefined) {
    return method === 'POST' ? agentResultResponse(await createAgentTpAction(request, await bodyWith(request, {podId}))) : methodNotAllowed();
  }
  if (fourth === 'actions' && isUuid(fifth) && sixth === undefined) {
    if (method === 'PATCH') {
      return agentResultResponse(await updateAgentTpAction(request, await bodyWith(request, {podId, actionId: fifth})));
    }
    if (method === 'DELETE') {
      return agentResultResponse(await deleteAgentTpAction(request, {podId, actionId: fifth}));
    }
    return methodNotAllowed();
  }
  if (fourth === 'routes' && fifth === undefined) {
    return method === 'POST' ? agentResultResponse(await createAgentTpRoute(request, await bodyWith(request, {podId}))) : methodNotAllowed();
  }
  if (fourth === 'routes' && isUuid(fifth) && sixth === undefined) {
    if (method === 'PATCH') {
      return agentResultResponse(await updateAgentTpRoute(request, await bodyWith(request, {podId, routeId: fifth})));
    }
    if (method === 'DELETE') {
      return agentResultResponse(await deleteAgentTpRoute(request, {podId, routeId: fifth}));
    }
    return methodNotAllowed();
  }
  if (fourth === 'routes' && isUuid(fifth) && sixth === 'select') {
    return method === 'POST' ? agentResultResponse(await selectAgentTpRoute(request, await bodyWith(request, {podId, routeId: fifth}))) : methodNotAllowed();
  }
  if (fourth === 'transports' && fifth === undefined) {
    return method === 'POST' ? agentResultResponse(await createAgentTpTransport(request, await bodyWith(request, {podId}))) : methodNotAllowed();
  }
  if (fourth === 'transports' && isUuid(fifth) && sixth === undefined) {
    if (method === 'PATCH') {
      return agentResultResponse(await updateAgentTpTransport(request, await bodyWith(request, {podId, transportId: fifth})));
    }
    if (method === 'DELETE') {
      return agentResultResponse(await deleteAgentTpTransport(request, {podId, transportId: fifth}));
    }
    return methodNotAllowed();
  }
  if (fourth === 'attachments' && fifth === undefined) {
    if (method === 'GET') {
      return agentResultResponse(await listAgentTpAttachments(request, queryInput(request, {podId})));
    }
    if (method === 'POST') {
      return agentResultResponse(await uploadAgentTpAttachment(request, await bodyWith(request, {podId})));
    }
    return methodNotAllowed();
  }
  if (fourth === 'attachments' && isUuid(fifth) && sixth === undefined) {
    return method === 'DELETE' ? agentResultResponse(await deleteAgentTpAttachment(request, {podId, attachmentId: fifth})) : methodNotAllowed();
  }
  return undefined;
}

async function dispatchFp(method: string, request: Request, path: readonly string[]): Promise<Response | undefined> {
  const [, id, third, fourth, fifth, sixth] = path;
  if (path[0] !== 'pods' || !isUuid(id) || third !== 'fp') {
    return undefined;
  }
  const podId = id;
  if (fourth === 'accounts' && fifth === undefined) {
    if (method === 'GET') {
      return agentResultResponse(await listAgentFpAccounts(request, {podId}));
    }
    if (method === 'POST') {
      return agentResultResponse(await createAgentFpAccount(request, await bodyWith(request, {podId})));
    }
    return methodNotAllowed();
  }
  if (fourth === 'accounts' && isUuid(fifth) && sixth === undefined) {
    if (method === 'PATCH') {
      return agentResultResponse(await updateAgentFpAccount(request, await bodyWith(request, {podId, accountId: fifth})));
    }
    if (method === 'DELETE') {
      return agentResultResponse(await deleteAgentFpAccount(request, {podId, accountId: fifth}));
    }
    return methodNotAllowed();
  }
  if (fourth === 'categories' && fifth === undefined) {
    if (method === 'GET') {
      return agentResultResponse(await listAgentFpCategories(request, {podId}));
    }
    if (method === 'POST') {
      return agentResultResponse(await createAgentFpCategory(request, await bodyWith(request, {podId})));
    }
    return methodNotAllowed();
  }
  if (fourth === 'categories' && isUuid(fifth) && sixth === undefined) {
    if (method === 'PATCH') {
      return agentResultResponse(await updateAgentFpCategory(request, await bodyWith(request, {podId, categoryId: fifth})));
    }
    if (method === 'DELETE') {
      return agentResultResponse(await deleteAgentFpCategory(request, {podId, categoryId: fifth}));
    }
    return methodNotAllowed();
  }
  if (fourth === 'transactions' && fifth === undefined) {
    if (method === 'GET') {
      return agentResultResponse(await listAgentFpTransactions(request, queryInput(request, {podId})));
    }
    if (method === 'POST') {
      return agentResultResponse(await createAgentFpTransaction(request, await bodyWith(request, {podId})));
    }
    return methodNotAllowed();
  }
  if (fourth === 'transactions' && fifth === 'assign') {
    return method === 'POST' ? agentResultResponse(await assignAgentFpTransactionCategory(request, await bodyWith(request, {podId}))) : methodNotAllowed();
  }
  if (fourth === 'transactions' && fifth === 'bulk-assign') {
    return method === 'POST'
      ? agentResultResponse(await bulkAssignAgentFpTransactionCategory(request, await bodyWith(request, {podId})))
      : methodNotAllowed();
  }
  if (fourth === 'transactions' && fifth === 'confirm') {
    return method === 'POST' ? agentResultResponse(await confirmAgentFpTransactions(request, await bodyWith(request, {podId}))) : methodNotAllowed();
  }
  if (fourth === 'transactions' && fifth === 'auto-assign' && sixth === 'preview') {
    return method === 'POST' ? agentResultResponse(await previewAgentFpAutoAssign(request, {podId})) : methodNotAllowed();
  }
  if (fourth === 'transactions' && fifth === 'auto-assign' && sixth === 'apply') {
    return method === 'POST' ? agentResultResponse(await applyAgentFpAutoAssign(request, {podId})) : methodNotAllowed();
  }
  if (fourth === 'transactions' && fifth === 'delete-all') {
    return method === 'POST' ? agentResultResponse(await deleteAllAgentFpTransactions(request, {podId})) : methodNotAllowed();
  }
  if (fourth === 'transactions' && isUuid(fifth) && sixth === undefined) {
    if (method === 'PATCH') {
      return agentResultResponse(await updateAgentFpTransaction(request, await bodyWith(request, {podId, transactionId: fifth})));
    }
    if (method === 'DELETE') {
      return agentResultResponse(await deleteAgentFpTransaction(request, {podId, transactionId: fifth}));
    }
    return methodNotAllowed();
  }
  if (fourth === 'parsers' && fifth === undefined) {
    if (method === 'GET') {
      return agentResultResponse(await listAgentFpParsers(request, {podId}));
    }
    if (method === 'POST') {
      return agentResultResponse(await createAgentFpParser(request, await bodyWith(request, {podId})));
    }
    return methodNotAllowed();
  }
  if (fourth === 'parsers' && isUuid(fifth) && sixth === undefined) {
    if (method === 'PATCH') {
      return agentResultResponse(await updateAgentFpParser(request, await bodyWith(request, {podId, parserId: fifth})));
    }
    if (method === 'DELETE') {
      return agentResultResponse(await deleteAgentFpParser(request, {podId, parserId: fifth}));
    }
    return methodNotAllowed();
  }
  if (fourth === 'imports' && fifth === undefined) {
    if (method === 'GET') {
      return agentResultResponse(await listAgentFpImports(request, {podId}));
    }
    if (method === 'POST') {
      return agentResultResponse(await createAgentFpImport(request, await bodyWith(request, {podId})));
    }
    return methodNotAllowed();
  }
  if (fourth === 'imports' && fifth === 'files') {
    return method === 'GET' ? agentResultResponse(await listAgentFpImportFiles(request, {podId})) : methodNotAllowed();
  }
  if (fourth === 'imports' && fifth === 'hash') {
    return method === 'GET' ? agentResultResponse(await hasAgentFpImportHash(request, queryInput(request, {podId}))) : methodNotAllowed();
  }
  if (fourth === 'imports' && isUuid(fifth) && sixth === 'undo') {
    return method === 'POST' ? agentResultResponse(await undoAgentFpImport(request, {podId, importId: fifth})) : methodNotAllowed();
  }
  if (fourth === 'bill-splits' && fifth === undefined) {
    return method === 'POST' ? agentResultResponse(await createAgentFpBillSplit(request, await bodyWith(request, {podId}))) : methodNotAllowed();
  }
  if (fourth === 'bill-splits' && isUuid(fifth) && sixth === undefined) {
    return method === 'DELETE' ? agentResultResponse(await deleteAgentFpBillSplit(request, {podId, parentId: fifth})) : methodNotAllowed();
  }
  if (fourth === 'settings' && fifth === undefined) {
    if (method === 'GET') {
      return agentResultResponse(await getAgentFpSetting(request, {podId}));
    }
    if (method === 'PATCH') {
      return agentResultResponse(await updateAgentFpSetting(request, await bodyWith(request, {podId})));
    }
    return methodNotAllowed();
  }
  return undefined;
}
