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
import type {AgentResult} from '@/lib/api/agent/agentResult';
import {MCP_EXTRA_TOOLS} from '@/lib/api/mcp/mcpCatalogExtra';

export interface McpTool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: {readonly type: 'object'; readonly properties: Record<string, unknown>; readonly required?: readonly string[]};
  readonly run: (request: Request, args: unknown) => Promise<AgentResult<unknown>>;
}

const podId = {type: 'string', description: 'Pod id'};
const spaceId = {type: 'string', description: 'Space id'};
const title = {type: 'string'};
const limit = {type: 'number'};
const offset = {type: 'number'};

function tool(
  name: string,
  description: string,
  properties: Record<string, unknown>,
  required: readonly string[],
  run: McpTool['run'],
): McpTool {
  return {name, description, inputSchema: {type: 'object', properties, required}, run};
}

// Core MCP tools: API key, spaces, pods, membership, profile
export const CORE_MCP_TOOLS: readonly McpTool[] = [
  tool('get_api_key_permissions', 'Effective rights for this API key.', {}, [], (request) => getAgentApiKeyPermissions(request)),
  tool('get_space', 'Read a space.', {spaceId}, ['spaceId'], (request, args) => getAgentSpace(request, stringField(args, 'spaceId'))),
  tool('update_space', 'Update the space name and description.', {spaceId, name: title, description: {type: 'string'}}, ['spaceId', 'name'], (request, args) =>
    updateAgentSpace(request, args),
  ),
  tool('list_space_pods', 'List pods this key may access.', {spaceId}, ['spaceId'], (request, args) => listAgentSpacePods(request, stringField(args, 'spaceId'))),
  tool('list_space_members', 'List space members.', {spaceId}, ['spaceId'], (request, args) => listAgentSpaceMembers(request, stringField(args, 'spaceId'))),
  tool(
    'update_space_member_role',
    'Change a member role to space_admin or space_user.',
    {spaceId, userId: {type: 'string'}, role: {type: 'string'}},
    ['spaceId', 'userId', 'role'],
    (request, args) => updateAgentSpaceMemberRole(request, args),
  ),
  tool('list_space_invites', 'List space invites.', {spaceId}, ['spaceId'], (request, args) => listAgentSpaceInvites(request, stringField(args, 'spaceId'))),
  tool(
    'create_space_invite',
    'Create a space invite. Returns the token once.',
    {spaceId, expiresInDays: {type: 'number'}, maxUses: {type: 'number'}},
    ['spaceId', 'expiresInDays', 'maxUses'],
    (request, args) => createAgentSpaceInvite(request, args),
  ),
  tool('delete_space_invite', 'Delete a space invite.', {spaceId, inviteId: {type: 'string'}}, ['spaceId', 'inviteId'], (request, args) =>
    deleteAgentSpaceInvite(request, args),
  ),
  ...MCP_EXTRA_TOOLS,
];

// Todo MCP tools
export const TODO_MCP_TOOLS: readonly McpTool[] = [
  tool('list_todo_columns', 'List columns on a todo pod.', {podId, limit, offset}, ['podId'], (request, args) => listAgentTodoColumns(request, args)),
  tool('create_todo_column', 'Create a todo column.', {podId, title, sortOrder: {type: 'number'}}, ['podId', 'title'], (request, args) =>
    createAgentTodoColumn(request, args),
  ),
  tool(
    'update_todo_column',
    'Update a todo column.',
    {podId, columnId: {type: 'string'}, title, sortOrder: {type: 'number'}},
    ['podId', 'columnId'],
    (request, args) => updateAgentTodoColumn(request, args),
  ),
  tool('delete_todo_column', 'Delete a todo column.', {podId, columnId: {type: 'string'}}, ['podId', 'columnId'], (request, args) =>
    deleteAgentTodoColumn(request, args),
  ),
  tool(
    'list_todo_cards',
    'List cards on a todo pod.',
    {podId, tag: {type: 'string'}, limit, offset},
    ['podId'],
    (request, args) => listAgentTodoCards(request, args),
  ),
  tool(
    'create_todo_card',
    'Create a todo card.',
    {podId, title, columnId: {type: 'string'}, description: {type: 'string'}, tags: {type: 'array', items: {type: 'string'}}, dueAt: {type: 'string'}},
    ['podId', 'title', 'columnId'],
    (request, args) => createAgentTodoCard(request, args),
  ),
  tool(
    'update_todo_card',
    'Update a todo card.',
    {
      podId,
      cardId: {type: 'string'},
      title,
      columnId: {type: 'string'},
      description: {type: 'string'},
      tags: {type: 'array', items: {type: 'string'}},
      dueAt: {type: 'string'},
      sortOrder: {type: 'number'},
      completedAt: {type: 'string'},
      assigneeUserId: {type: 'string'},
    },
    ['podId', 'cardId'],
    (request, args) => updateAgentTodoCard(request, args),
  ),
  tool('delete_todo_card', 'Delete a todo card.', {podId, cardId: {type: 'string'}}, ['podId', 'cardId'], (request, args) => deleteAgentTodoCard(request, args)),
  tool('list_todo_comments', 'List comments on a todo card.', {podId, cardId: {type: 'string'}, limit, offset}, ['podId', 'cardId'], (request, args) =>
    listAgentTodoComments(request, args),
  ),
  tool('create_todo_comment', 'Create a todo comment.', {podId, cardId: {type: 'string'}, body: {type: 'string'}}, ['podId', 'cardId', 'body'], (request, args) =>
    createAgentTodoComment(request, args),
  ),
  tool(
    'update_todo_comment',
    'Update your todo comment.',
    {podId, cardId: {type: 'string'}, commentId: {type: 'string'}, body: {type: 'string'}},
    ['podId', 'cardId', 'commentId', 'body'],
    (request, args) => updateAgentTodoComment(request, args),
  ),
  tool(
    'delete_todo_comment',
    'Delete a todo comment.',
    {podId, cardId: {type: 'string'}, commentId: {type: 'string'}},
    ['podId', 'cardId', 'commentId'],
    (request, args) => deleteAgentTodoComment(request, args),
  ),
];

// Legacy MCP_TOOLS for backward compatibility (will be removed)
export const MCP_TOOLS: readonly McpTool[] = CORE_MCP_TOOLS;

function stringField(args: unknown, key: string): string {
  if (typeof args === 'object' && args !== null && key in args) {
    const value = (args as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : '';
  }
  return '';
}

export function findMcpTool(name: string, tools: readonly McpTool[]): McpTool | undefined {
  return tools.find((item) => item.name === name);
}
