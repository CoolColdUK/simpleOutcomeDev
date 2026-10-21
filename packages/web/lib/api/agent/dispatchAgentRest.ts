import {agentResultResponse} from '@/lib/api/agent/agentResult';
import {
  createAgentSpaceInvite,
  deleteAgentSpaceInvite,
  getAgentApiKeyPermissions,
  getAgentSpace,
  listAgentSpaceInvites,
  listAgentSpaceMembers,
  listAgentSpacePods,
  updateAgentSpace,
  updateAgentSpaceMemberRole,
} from '@/lib/api/agent/spaceAgent';
import {createAgentTodoCard, deleteAgentTodoCard, listAgentTodoCards, updateAgentTodoCard} from '@/lib/api/agent/todoAgentCards';
import {createAgentTodoColumn, deleteAgentTodoColumn, listAgentTodoColumns, updateAgentTodoColumn} from '@/lib/api/agent/todoAgentColumns';
import {createAgentTodoComment, deleteAgentTodoComment, listAgentTodoComments, updateAgentTodoComment} from '@/lib/api/agent/todoAgentComments';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function notFound(): Response {
  return Response.json({error: {code: 'not_found', message: 'Not found'}}, {status: 404});
}

function methodNotAllowed(): Response {
  return Response.json({error: {code: 'method_not_allowed', message: 'Method not allowed'}}, {status: 405});
}

function queryInput(request: Request, ids: Record<string, string>): Record<string, unknown> {
  const url = new URL(request.url);
  const limit = url.searchParams.get('limit');
  const offset = url.searchParams.get('offset');
  const tag = url.searchParams.get('tag');
  return {
    ...ids,
    ...(limit === null ? {} : {limit: Number(limit)}),
    ...(offset === null ? {} : {offset: Number(offset)}),
    ...(tag === null || tag === '' ? {} : {tag}),
  };
}

async function bodyWith(request: Request, ids: Record<string, string>): Promise<unknown> {
  const body = await request.json().catch(() => undefined);
  const base = typeof body === 'object' && body !== null && !Array.isArray(body) ? body : {};
  return {...base, ...ids};
}

export default async function dispatchAgentRest(method: string, request: Request, path: readonly string[]): Promise<Response> {
  const [root, id, third, fourth, fifth, sixth, seventh] = path;
  if (root === 'api-keys' && id === 'me' && third === undefined) {
    return method === 'GET' ? agentResultResponse(await getAgentApiKeyPermissions(request)) : methodNotAllowed();
  }
  if (root === 'spaces' && UUID.test(id ?? '') && third === undefined) {
    if (method === 'GET') {
      return agentResultResponse(await getAgentSpace(request, id ?? ''));
    }
    if (method === 'PATCH') {
      return agentResultResponse(await updateAgentSpace(request, await bodyWith(request, {spaceId: id ?? ''})));
    }
    return methodNotAllowed();
  }
  if (root === 'spaces' && UUID.test(id ?? '') && third === 'pods' && fourth === undefined) {
    return method === 'GET' ? agentResultResponse(await listAgentSpacePods(request, id ?? '')) : methodNotAllowed();
  }
  if (root === 'spaces' && UUID.test(id ?? '') && third === 'members' && fourth === undefined) {
    return method === 'GET' ? agentResultResponse(await listAgentSpaceMembers(request, id ?? '')) : methodNotAllowed();
  }
  if (root === 'spaces' && UUID.test(id ?? '') && third === 'members' && UUID.test(fourth ?? '') && fifth === undefined) {
    return method === 'PATCH'
      ? agentResultResponse(await updateAgentSpaceMemberRole(request, await bodyWith(request, {spaceId: id ?? '', userId: fourth ?? ''})))
      : methodNotAllowed();
  }
  if (root === 'spaces' && UUID.test(id ?? '') && third === 'invites' && fourth === undefined) {
    if (method === 'GET') {
      return agentResultResponse(await listAgentSpaceInvites(request, id ?? ''));
    }
    if (method === 'POST') {
      return agentResultResponse(await createAgentSpaceInvite(request, await bodyWith(request, {spaceId: id ?? ''})));
    }
    return methodNotAllowed();
  }
  if (root === 'spaces' && UUID.test(id ?? '') && third === 'invites' && UUID.test(fourth ?? '') && fifth === undefined) {
    return method === 'DELETE'
      ? agentResultResponse(await deleteAgentSpaceInvite(request, {spaceId: id ?? '', inviteId: fourth ?? ''}))
      : methodNotAllowed();
  }
  if (root === 'pods' && UUID.test(id ?? '') && third === 'todo' && fourth === 'columns' && fifth === undefined) {
    if (method === 'GET') {
      return agentResultResponse(await listAgentTodoColumns(request, queryInput(request, {podId: id ?? ''})));
    }
    if (method === 'POST') {
      return agentResultResponse(await createAgentTodoColumn(request, await bodyWith(request, {podId: id ?? ''})));
    }
    return methodNotAllowed();
  }
  if (root === 'pods' && UUID.test(id ?? '') && third === 'todo' && fourth === 'columns' && UUID.test(fifth ?? '') && sixth === undefined) {
    if (method === 'PATCH') {
      return agentResultResponse(await updateAgentTodoColumn(request, await bodyWith(request, {podId: id ?? '', columnId: fifth ?? ''})));
    }
    if (method === 'DELETE') {
      return agentResultResponse(await deleteAgentTodoColumn(request, {podId: id ?? '', columnId: fifth ?? ''}));
    }
    return methodNotAllowed();
  }
  if (root === 'pods' && UUID.test(id ?? '') && third === 'todo' && fourth === 'cards' && fifth === undefined) {
    if (method === 'GET') {
      return agentResultResponse(await listAgentTodoCards(request, queryInput(request, {podId: id ?? ''})));
    }
    if (method === 'POST') {
      return agentResultResponse(await createAgentTodoCard(request, await bodyWith(request, {podId: id ?? ''})));
    }
    return methodNotAllowed();
  }
  if (root === 'pods' && UUID.test(id ?? '') && third === 'todo' && fourth === 'cards' && UUID.test(fifth ?? '') && sixth === undefined) {
    if (method === 'PATCH') {
      return agentResultResponse(await updateAgentTodoCard(request, await bodyWith(request, {podId: id ?? '', cardId: fifth ?? ''})));
    }
    if (method === 'DELETE') {
      return agentResultResponse(await deleteAgentTodoCard(request, {podId: id ?? '', cardId: fifth ?? ''}));
    }
    return methodNotAllowed();
  }
  if (root === 'pods' && UUID.test(id ?? '') && third === 'todo' && fourth === 'cards' && UUID.test(fifth ?? '') && sixth === 'comments' && seventh === undefined) {
    if (method === 'GET') {
      return agentResultResponse(await listAgentTodoComments(request, queryInput(request, {podId: id ?? '', cardId: fifth ?? ''})));
    }
    if (method === 'POST') {
      return agentResultResponse(await createAgentTodoComment(request, await bodyWith(request, {podId: id ?? '', cardId: fifth ?? ''})));
    }
    return methodNotAllowed();
  }
  if (
    root === 'pods' &&
    UUID.test(id ?? '') &&
    third === 'todo' &&
    fourth === 'cards' &&
    UUID.test(fifth ?? '') &&
    sixth === 'comments' &&
    UUID.test(seventh ?? '') &&
    path.length === 7
  ) {
    if (method === 'PATCH') {
      return agentResultResponse(
        await updateAgentTodoComment(request, await bodyWith(request, {podId: id ?? '', cardId: fifth ?? '', commentId: seventh ?? ''})),
      );
    }
    if (method === 'DELETE') {
      return agentResultResponse(await deleteAgentTodoComment(request, {podId: id ?? '', cardId: fifth ?? '', commentId: seventh ?? ''}));
    }
    return methodNotAllowed();
  }
  return notFound();
}
