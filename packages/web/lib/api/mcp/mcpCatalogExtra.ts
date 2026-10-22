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
import type {McpTool} from '@/lib/api/mcp/mcpCatalog';

const podId = {type: 'string', description: 'Pod id'};
const spaceId = {type: 'string', description: 'Space id'};
const name = {type: 'string'};

function tool(
  toolName: string,
  description: string,
  properties: Record<string, unknown>,
  required: readonly string[],
  run: McpTool['run'],
): McpTool {
  return {name: toolName, description, inputSchema: {type: 'object', properties, required}, run};
}

// Re-export reorganized tools
export {CORE_EXTRA_MCP_TOOLS, TODO_EXTRA_MCP_TOOLS, FP_MCP_TOOLS} from '@/lib/api/mcp/reorganizeMcpCatalogExtra';

// Legacy export for backward compatibility (will be removed)
export const MCP_EXTRA_TOOLS: readonly McpTool[] = [
  tool('list_spaces', 'List spaces the key owner belongs to.', {}, [], (request) => listAgentSpaces(request)),
  tool('create_space', 'Create a space. The new space is not granted on this key.', {name, description: {type: 'string'}}, ['name'], (request, args) =>
    createAgentSpace(request, args),
  ),
  tool('join_space_by_invite', 'Join a space with an invite token.', {token: {type: 'string'}}, ['token'], (request, args) =>
    joinAgentSpaceByInvite(request, args),
  ),
  tool(
    'create_pod',
    'Create a pod in a space.',
    {spaceId, feature: {type: 'string'}, name, visibility: {type: 'string'}, description: {type: 'string'}},
    ['spaceId', 'feature', 'name', 'visibility'],
    (request, args) => createAgentPod(request, args),
  ),
  tool(
    'update_pod',
    'Update a pod name, visibility, and description.',
    {podId, name, visibility: {type: 'string'}, description: {type: 'string'}},
    ['podId', 'name', 'visibility'],
    (request, args) => updateAgentPod(request, args),
  ),
  tool('set_pod_status', 'Archive or restore a pod.', {podId, status: {type: 'string'}}, ['podId', 'status'], (request, args) =>
    setAgentPodStatus(request, args),
  ),
  tool('delete_pod', 'Delete a pod.', {podId}, ['podId'], (request, args) => deleteAgentPod(request, args)),
  tool('search_pods', 'Find open or request pods in a space.', {spaceId, query: {type: 'string'}}, ['spaceId'], (request, args) =>
    searchAgentPods(request, args),
  ),
  tool('join_open_pod', 'Join an open pod.', {podId, spaceId}, ['podId'], (request, args) => joinAgentOpenPod(request, args)),
  tool('create_pod_join_request', 'Request to join a pod.', {podId, spaceId}, ['podId'], (request, args) => createAgentPodJoinRequest(request, args)),
  tool('disable_space_invite', 'Disable a space invite.', {spaceId, inviteId: {type: 'string'}}, ['spaceId', 'inviteId'], (request, args) =>
    disableAgentSpaceInvite(request, args),
  ),
  tool('list_pod_members', 'List pod members.', {podId}, ['podId'], (request, args) => listAgentPodMembers(request, args)),
  tool(
    'add_pod_member_by_username',
    'Add a space member to a pod by username.',
    {podId, username: {type: 'string'}, role: {type: 'string'}},
    ['podId', 'username', 'role'],
    (request, args) => addAgentPodMemberByUsername(request, args),
  ),
  tool(
    'update_pod_member_role',
    'Change a pod member role.',
    {podId, userId: {type: 'string'}, role: {type: 'string'}},
    ['podId', 'userId', 'role'],
    (request, args) => updateAgentPodMemberRole(request, args),
  ),
  tool('list_pod_join_requests', 'List pending pod join requests.', {podId}, ['podId'], (request, args) => listAgentPodJoinRequests(request, args)),
  tool('approve_pod_join_request', 'Approve a pod join request.', {podId, requestId: {type: 'string'}}, ['podId', 'requestId'], (request, args) =>
    approveAgentPodJoinRequest(request, args),
  ),
  tool('deny_pod_join_request', 'Deny a pod join request.', {podId, requestId: {type: 'string'}}, ['podId', 'requestId'], (request, args) =>
    denyAgentPodJoinRequest(request, args),
  ),
  tool('reorder_todo_columns', 'Reorder todo columns.', {podId, orderedIds: {type: 'array', items: {type: 'string'}}}, ['podId', 'orderedIds'], (request, args) =>
    reorderAgentTodoColumns(request, args),
  ),
  tool('reorder_todo_cards', 'Reorder todo cards.', {podId, items: {type: 'array'}}, ['podId', 'items'], (request, args) => reorderAgentTodoCards(request, args)),
  tool('archive_todo_column_cards', 'Archive every card in a column.', {podId, columnId: {type: 'string'}}, ['podId', 'columnId'], (request, args) =>
    archiveAgentTodoColumnCards(request, args),
  ),
  tool(
    'archive_todo_column_completed',
    'Archive completed cards in a column.',
    {podId, columnId: {type: 'string'}},
    ['podId', 'columnId'],
    (request, args) => archiveAgentTodoColumnCompleted(request, args),
  ),
  tool(
    'replace_todo_card_icon',
    'Replace a todo card icon. Send a JPEG or PNG as base64.',
    {podId, cardId: {type: 'string'}, contentType: {type: 'string'}, contentBase64: {type: 'string'}},
    ['podId', 'cardId', 'contentType', 'contentBase64'],
    (request, args) => replaceAgentTodoCardIcon(request, args),
  ),
  tool('clear_todo_card_icon', 'Remove a todo card icon.', {podId, cardId: {type: 'string'}}, ['podId', 'cardId'], (request, args) =>
    clearAgentTodoCardIcon(request, args),
  ),
  tool('get_profile', 'Read the key owner profile.', {}, [], (request) => getAgentProfile(request)),
  tool('update_profile_display_name', 'Update the profile display name.', {displayName: {type: 'string'}}, ['displayName'], (request, args) =>
    updateAgentProfileDisplayName(request, args),
  ),
  tool('update_profile_username', 'Update the profile username. Subject to the 30 day cooldown.', {username: {type: 'string'}}, ['username'], (request, args) =>
    updateAgentProfileUsername(request, args),
  ),
  tool('list_fp_accounts', 'List financial planning accounts and balances.', {podId}, ['podId'], (request, args) => listAgentFpAccounts(request, args)),
  tool('create_fp_account', 'Create a financial planning account.', {podId, name, kind: {type: 'string'}, openingFund: {type: 'number'}}, ['podId', 'name', 'kind'], (request, args) =>
    createAgentFpAccount(request, args),
  ),
  tool('update_fp_account', 'Update a financial planning account.', {podId, accountId: {type: 'string'}, name, kind: {type: 'string'}}, ['podId', 'accountId'], (request, args) =>
    updateAgentFpAccount(request, args),
  ),
  tool('delete_fp_account', 'Delete a financial planning account.', {podId, accountId: {type: 'string'}}, ['podId', 'accountId'], (request, args) =>
    deleteAgentFpAccount(request, args),
  ),
  tool('list_fp_categories', 'List financial planning categories.', {podId}, ['podId'], (request, args) => listAgentFpCategories(request, args)),
  tool('create_fp_category', 'Create a financial planning category.', {podId, name, direction: {type: 'string'}}, ['podId', 'name', 'direction'], (request, args) =>
    createAgentFpCategory(request, args),
  ),
  tool('update_fp_category', 'Update a financial planning category.', {podId, categoryId: {type: 'string'}}, ['podId', 'categoryId'], (request, args) =>
    updateAgentFpCategory(request, args),
  ),
  tool('delete_fp_category', 'Delete a financial planning category.', {podId, categoryId: {type: 'string'}}, ['podId', 'categoryId'], (request, args) =>
    deleteAgentFpCategory(request, args),
  ),
  tool('list_fp_transactions', 'List financial planning transactions.', {podId, limit: {type: 'number'}, offset: {type: 'number'}}, ['podId'], (request, args) =>
    listAgentFpTransactions(request, args),
  ),
  tool(
    'create_fp_transaction',
    'Create a financial planning transaction.',
    {podId, accountId: {type: 'string'}, postedDate: {type: 'string'}, amount: {type: 'number'}},
    ['podId', 'accountId', 'postedDate', 'amount'],
    (request, args) => createAgentFpTransaction(request, args),
  ),
  tool('update_fp_transaction', 'Update a financial planning transaction, including archive.', {podId, transactionId: {type: 'string'}}, ['podId', 'transactionId'], (request, args) =>
    updateAgentFpTransaction(request, args),
  ),
  tool('delete_fp_transaction', 'Delete a financial planning transaction.', {podId, transactionId: {type: 'string'}}, ['podId', 'transactionId'], (request, args) =>
    deleteAgentFpTransaction(request, args),
  ),
  tool(
    'assign_fp_transaction_category',
    'Assign or clear a transaction category.',
    {podId, transactionId: {type: 'string'}, categoryId: {type: 'string'}},
    ['podId', 'transactionId'],
    (request, args) => assignAgentFpTransactionCategory(request, args),
  ),
  tool(
    'bulk_assign_fp_transaction_category',
    'Assign one category to many transactions.',
    {podId, transactionIds: {type: 'array', items: {type: 'string'}}, categoryId: {type: 'string'}},
    ['podId', 'transactionIds', 'categoryId'],
    (request, args) => bulkAssignAgentFpTransactionCategory(request, args),
  ),
  tool(
    'confirm_fp_transactions',
    'Confirm financial planning transactions.',
    {podId, transactionIds: {type: 'array', items: {type: 'string'}}},
    ['podId', 'transactionIds'],
    (request, args) => confirmAgentFpTransactions(request, args),
  ),
  tool('preview_fp_auto_assign', 'Preview automatic category assignment.', {podId}, ['podId'], (request, args) => previewAgentFpAutoAssign(request, args)),
  tool('apply_fp_auto_assign', 'Apply automatic category assignment.', {podId}, ['podId'], (request, args) => applyAgentFpAutoAssign(request, args)),
  tool('delete_all_fp_transactions', 'Delete every transaction in the pod. Requires the delete-all grant.', {podId}, ['podId'], (request, args) =>
    deleteAllAgentFpTransactions(request, args),
  ),
  tool('list_fp_parsers', 'List financial planning parsers.', {podId}, ['podId'], (request, args) => listAgentFpParsers(request, args)),
  tool('create_fp_parser', 'Create a financial planning parser.', {podId, name, columnMap: {type: 'object'}}, ['podId', 'name', 'columnMap'], (request, args) =>
    createAgentFpParser(request, args),
  ),
  tool('update_fp_parser', 'Update a financial planning parser.', {podId, parserId: {type: 'string'}}, ['podId', 'parserId'], (request, args) =>
    updateAgentFpParser(request, args),
  ),
  tool('delete_fp_parser', 'Delete a financial planning parser.', {podId, parserId: {type: 'string'}}, ['podId', 'parserId'], (request, args) =>
    deleteAgentFpParser(request, args),
  ),
  tool('list_fp_imports', 'List financial planning imports.', {podId}, ['podId'], (request, args) => listAgentFpImports(request, args)),
  tool('list_fp_import_files', 'List files recorded on financial planning imports.', {podId}, ['podId'], (request, args) => listAgentFpImportFiles(request, args)),
  tool('has_fp_import_hash', 'Check whether an import file hash is already stored.', {podId, sha256: {type: 'string'}}, ['podId', 'sha256'], (request, args) =>
    hasAgentFpImportHash(request, args),
  ),
  tool(
    'create_fp_import',
    'Import mapped financial planning rows.',
    {podId, accountId: {type: 'string'}, parserId: {type: 'string'}, files: {type: 'array'}},
    ['podId', 'accountId', 'files'],
    (request, args) => createAgentFpImport(request, args),
  ),
  tool('undo_fp_import', 'Undo a financial planning import.', {podId, importId: {type: 'string'}}, ['podId', 'importId'], (request, args) =>
    undoAgentFpImport(request, args),
  ),
  tool(
    'create_fp_bill_split',
    'Split a transaction into monthly portions.',
    {podId, parentId: {type: 'string'}, portionCount: {type: 'number'}, startDate: {type: 'string'}},
    ['podId', 'parentId', 'portionCount', 'startDate'],
    (request, args) => createAgentFpBillSplit(request, args),
  ),
  tool('delete_fp_bill_split', 'Delete a bill split.', {podId, parentId: {type: 'string'}}, ['podId', 'parentId'], (request, args) =>
    deleteAgentFpBillSplit(request, args),
  ),
  tool('get_fp_setting', 'Read financial planning settings.', {podId}, ['podId'], (request, args) => getAgentFpSetting(request, args)),
  tool('update_fp_setting', 'Update currency or the permission matrix.', {podId, currency: {type: 'string'}, permission: {type: 'object'}}, ['podId'], (request, args) =>
    updateAgentFpSetting(request, args),
  ),
];
