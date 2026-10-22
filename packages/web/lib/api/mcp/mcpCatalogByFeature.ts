/**
 * Feature-scoped MCP tool catalogs for /api/mcp/{feature} endpoints
 * 
 * Layout:
 * - /api/mcp → CORE tools (spaces, groups, pods, membership, profile, API key)
 * - /api/mcp/trip → TRIP tools only
 * - /api/mcp/todo → TODO tools only (including extra board operations)
 * - /api/mcp/fp → FP tools only
 */

import {CORE_MCP_TOOLS, TODO_MCP_TOOLS, type McpTool} from '@/lib/api/mcp/mcpCatalog';
import {
  FP_MCP_TOOLS,
  TODO_EXTRA_MCP_TOOLS,
} from '@/lib/api/mcp/mcpCatalogExtra';
import {
  getAgentTpBudgetRollup,
  getAgentTpWorkspace,
  updateAgentTpTrip,
} from '@/lib/api/agent/tpAgentWorkspace';

// Re-export for convenience
export {type McpTool} from '@/lib/api/mcp/mcpCatalog';

const podId = {type: 'string', description: 'Pod id'};

function tool(
  name: string,
  description: string,
  properties: Record<string, unknown>,
  required: readonly string[],
  run: McpTool['run'],
): McpTool {
  return {name, description, inputSchema: {type: 'object', properties, required}, run};
}

// Trip planning MCP tools
export const TRIP_MCP_TOOLS: readonly McpTool[] = [
  // Core workspace
  tool('get_tp_workspace', 'Load complete trip workspace.', {podId}, ['podId'], (request, args) => getAgentTpWorkspace(request, args)),
  
  // Trip
  tool(
    'update_trip',
    'Update trip fields and settings.',
    {
      podId,
      title: {type: 'string'},
      timezone: {type: 'string'},
      startDate: {type: 'string'},
      endDate: {type: 'string'},
      status: {type: 'string'},
      budgetAmount: {type: 'number'},
      budgetCurrency: {type: 'string'},
      defaultCurrency: {type: 'string'},
      mapsUrl: {type: 'string'},
      notes: {type: 'string'},
    },
    ['podId'],
    (request, args) => updateAgentTpTrip(request, args),
  ),
  tool('get_tp_budget_rollup', 'Compute total costs vs budget.', {podId}, ['podId'], (request, args) => getAgentTpBudgetRollup(request, args)),
  
  // TODO: Add remaining 17 tools (destinations, days, actions, routes, transports, attachments)
];

/**
 * Get MCP tools for a specific feature endpoint
 */
export function getMcpToolsForFeature(feature: 'trip' | 'todo' | 'fp' | null): readonly McpTool[] {
  if (feature === 'trip') {
    return TRIP_MCP_TOOLS;
  }
  if (feature === 'todo') {
    return [...TODO_MCP_TOOLS, ...TODO_EXTRA_MCP_TOOLS];
  }
  if (feature === 'fp') {
    return FP_MCP_TOOLS;
  }
  // null = core endpoint (/api/mcp)
  return CORE_MCP_TOOLS;
}

/**
 * Find a tool by name in the given tool set
 */
export function findMcpToolInSet(name: string, tools: readonly McpTool[]): McpTool | undefined {
  return tools.find((tool) => tool.name === name);
}
