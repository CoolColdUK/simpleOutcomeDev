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
  createAgentTpTrip,
  getAgentTpBudgetRollup,
  getAgentTpWorkspace,
  updateAgentTpTrip,
} from '@/lib/api/agent/tpAgentWorkspace';
import {
  createAgentTpDestination,
  deleteAgentTpDestination,
  updateAgentTpDestination,
} from '@/lib/api/agent/tpAgentDestinations';
import {updateAgentTpDay} from '@/lib/api/agent/tpAgentDays';
import {
  createAgentTpAction,
  deleteAgentTpAction,
  updateAgentTpAction,
} from '@/lib/api/agent/tpAgentActions';
import {
  createAgentTpRoute,
  deleteAgentTpRoute,
  selectAgentTpRoute,
  updateAgentTpRoute,
} from '@/lib/api/agent/tpAgentRoutes';
import {
  createAgentTpTransport,
  deleteAgentTpTransport,
  updateAgentTpTransport,
} from '@/lib/api/agent/tpAgentTransports';
import {
  deleteAgentTpAttachment,
  listAgentTpAttachments,
  uploadAgentTpAttachment,
} from '@/lib/api/agent/tpAgentAttachments';

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

// Trip planning MCP tools (21 total)
export const TRIP_MCP_TOOLS: readonly McpTool[] = [
  // 1. Core workspace
  tool('get_tp_workspace', 'Load complete trip workspace with all entities.', {podId}, ['podId'], (request, args) => getAgentTpWorkspace(request, args)),

  tool(
    'create_trip',
    'Create the trip for a new trip-planning pod (title, dates, timezone, optional destinations). Fails if a trip already exists.',
    {
      podId,
      title: {type: 'string'},
      timezone: {type: 'string'},
      startDate: {type: 'string'},
      endDate: {type: 'string'},
      destinationNames: {type: 'array', items: {type: 'string'}},
      destinations: {type: 'string', description: 'Destination names, one per line (same as the web form)'},
      budgetAmount: {type: 'number'},
      budgetCurrency: {type: 'string'},
    },
    ['podId', 'title', 'timezone', 'startDate', 'endDate'],
    (request, args) => createAgentTpTrip(request, args),
  ),
  
  // 2-3. Trip metadata
  tool(
    'update_trip',
    'Update trip fields and settings (title, dates, budget, timezone, defaultCurrency).',
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
  
  // 4-6. Destinations
  tool(
    'create_tp_destination',
    'Create a new destination.',
    {
      podId,
      name: {type: 'string'},
      sortOrder: {type: 'number'},
      mapsUrl: {type: 'string'},
      timezoneHint: {type: 'string'},
      importantInfo: {type: 'string'},
      activeStartDate: {type: 'string'},
      activeEndDate: {type: 'string'},
      notes: {type: 'string'},
    },
    ['podId', 'name'],
    (request, args) => createAgentTpDestination(request, args),
  ),
  tool(
    'update_tp_destination',
    'Update destination fields (use sortOrder to reorder).',
    {
      podId,
      destinationId: {type: 'string'},
      name: {type: 'string'},
      sortOrder: {type: 'number'},
      mapsUrl: {type: 'string'},
      timezoneHint: {type: 'string'},
      importantInfo: {type: 'string'},
      activeStartDate: {type: 'string'},
      activeEndDate: {type: 'string'},
      notes: {type: 'string'},
    },
    ['podId', 'destinationId'],
    (request, args) => updateAgentTpDestination(request, args),
  ),
  tool('delete_tp_destination', 'Delete a destination.', {podId, destinationId: {type: 'string'}}, ['podId', 'destinationId'], (request, args) =>
    deleteAgentTpDestination(request, args),
  ),
  
  // 7. Day
  tool(
    'update_tp_day',
    'Update day (dayTitle, dayNotes, primaryDestinationId, manualAnchorDate to override auto-calculation).',
    {
      podId,
      dayId: {type: 'string'},
      dayTitle: {type: 'string'},
      dayNotes: {type: 'string'},
      primaryDestinationId: {type: 'string'},
    },
    ['podId', 'dayId'],
    (request, args) => updateAgentTpDay(request, args),
  ),
  
  // 8-10. Actions (stay/activity/note/travel)
  tool(
    'create_tp_action',
    'Create action. kind: stay/activity/note/travel. Local times → checkInLocalTime/checkInTimezone.',
    {
      podId,
      kind: {type: 'string'},
      title: {type: 'string'},
      anchorDayId: {type: 'string'},
      destinationId: {type: 'string'},
      placeText: {type: 'string'},
      mapsUrl: {type: 'string'},
      checkInLocalTime: {type: 'string'},
      checkInTimezone: {type: 'string'},
      checkOutLocalTime: {type: 'string'},
      checkOutTimezone: {type: 'string'},
      startTime: {type: 'string'},
      endTime: {type: 'string'},
      costAmount: {type: 'number'},
      costCurrency: {type: 'string'},
      bookingRef: {type: 'string'},
      url: {type: 'string'},
      notes: {type: 'string'},
      sortOrder: {type: 'number'},
      fromPlace: {type: 'string'},
      toPlace: {type: 'string'},
      fromDestinationId: {type: 'string'},
      toDestinationId: {type: 'string'},
      fromMapsUrl: {type: 'string'},
      toMapsUrl: {type: 'string'},
    },
    ['podId', 'kind', 'title'],
    (request, args) => createAgentTpAction(request, args),
  ),
  tool(
    'update_tp_action',
    'Update action fields (use sortOrder to reorder).',
    {
      podId,
      actionId: {type: 'string'},
      title: {type: 'string'},
      anchorDayId: {type: 'string'},
      destinationId: {type: 'string'},
      placeText: {type: 'string'},
      mapsUrl: {type: 'string'},
      checkInLocalTime: {type: 'string'},
      checkInTimezone: {type: 'string'},
      checkOutLocalTime: {type: 'string'},
      checkOutTimezone: {type: 'string'},
      startTime: {type: 'string'},
      endTime: {type: 'string'},
      costAmount: {type: 'number'},
      costCurrency: {type: 'string'},
      bookingRef: {type: 'string'},
      url: {type: 'string'},
      notes: {type: 'string'},
      selectedRouteId: {type: 'string'},
      sortOrder: {type: 'number'},
      fromPlace: {type: 'string'},
      toPlace: {type: 'string'},
      fromDestinationId: {type: 'string'},
      toDestinationId: {type: 'string'},
      fromMapsUrl: {type: 'string'},
      toMapsUrl: {type: 'string'},
    },
    ['podId', 'actionId'],
    (request, args) => updateAgentTpAction(request, args),
  ),
  tool('delete_tp_action', 'Delete an action.', {podId, actionId: {type: 'string'}}, ['podId', 'actionId'], (request, args) =>
    deleteAgentTpAction(request, args),
  ),
  
  // 11-14. Routes
  tool(
    'create_tp_route',
    'Create route option for a travel action.',
    {podId, actionId: {type: 'string'}, name: {type: 'string'}, notes: {type: 'string'}, sortOrder: {type: 'number'}},
    ['podId', 'actionId', 'name'],
    (request, args) => createAgentTpRoute(request, args),
  ),
  tool(
    'update_tp_route',
    'Update route (use sortOrder to reorder).',
    {podId, routeId: {type: 'string'}, name: {type: 'string'}, notes: {type: 'string'}, sortOrder: {type: 'number'}},
    ['podId', 'routeId'],
    (request, args) => updateAgentTpRoute(request, args),
  ),
  tool('delete_tp_route', 'Delete a route.', {podId, routeId: {type: 'string'}}, ['podId', 'routeId'], (request, args) =>
    deleteAgentTpRoute(request, args),
  ),
  tool(
    'select_tp_route',
    'Mark a route as selected for the travel action.',
    {podId, actionId: {type: 'string'}, routeId: {type: 'string'}},
    ['podId', 'actionId', 'routeId'],
    (request, args) => selectAgentTpRoute(request, args),
  ),
  
  // 15-17. Transports
  tool(
    'create_tp_transport',
    'Add transport leg to a route. mode: flight/train/bus/ferry/car/other. Local times → departLocalTime/departTimezone.',
    {
      podId,
      routeId: {type: 'string'},
      mode: {type: 'string'},
      fromPlace: {type: 'string'},
      toPlace: {type: 'string'},
      departLocalTime: {type: 'string'},
      departTimezone: {type: 'string'},
      arriveLocalTime: {type: 'string'},
      arriveTimezone: {type: 'string'},
      costAmount: {type: 'number'},
      costCurrency: {type: 'string'},
      bookingRef: {type: 'string'},
      url: {type: 'string'},
      notes: {type: 'string'},
      sortOrder: {type: 'number'},
    },
    ['podId', 'routeId'],
    (request, args) => createAgentTpTransport(request, args),
  ),
  tool(
    'update_tp_transport',
    'Update transport leg (use sortOrder to reorder).',
    {
      podId,
      transportId: {type: 'string'},
      mode: {type: 'string'},
      fromPlace: {type: 'string'},
      toPlace: {type: 'string'},
      departLocalTime: {type: 'string'},
      departTimezone: {type: 'string'},
      arriveLocalTime: {type: 'string'},
      arriveTimezone: {type: 'string'},
      costAmount: {type: 'number'},
      costCurrency: {type: 'string'},
      bookingRef: {type: 'string'},
      url: {type: 'string'},
      notes: {type: 'string'},
      sortOrder: {type: 'number'},
    },
    ['podId', 'transportId'],
    (request, args) => updateAgentTpTransport(request, args),
  ),
  tool('delete_tp_transport', 'Delete a transport leg.', {podId, transportId: {type: 'string'}}, ['podId', 'transportId'], (request, args) =>
    deleteAgentTpTransport(request, args),
  ),
  
  // 18-20. Attachments
  tool(
    'list_tp_attachments',
    'List attachments (filter by transportId or destinationId).',
    {podId, transportId: {type: 'string'}, destinationId: {type: 'string'}},
    ['podId'],
    (request, args) => listAgentTpAttachments(request, args),
  ),
  tool(
    'upload_tp_attachment',
    'Upload attachment (base64, 5MB max, JPEG/PNG/PDF). One of transportId or destinationId required.',
    {
      podId,
      transportId: {type: 'string'},
      destinationId: {type: 'string'},
      fileName: {type: 'string'},
      mimeType: {type: 'string'},
      contentBase64: {type: 'string'},
    },
    ['podId', 'fileName', 'mimeType', 'contentBase64'],
    (request, args) => uploadAgentTpAttachment(request, args),
  ),
  tool('delete_tp_attachment', 'Delete an attachment.', {podId, attachmentId: {type: 'string'}}, ['podId', 'attachmentId'], (request, args) =>
    deleteAgentTpAttachment(request, args),
  ),
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
