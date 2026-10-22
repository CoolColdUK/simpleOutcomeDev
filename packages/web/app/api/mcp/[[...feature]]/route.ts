/**
 * Per-feature MCP endpoints
 * 
 * Routes:
 * - POST /api/mcp → Core tools (spaces, groups, pods, profile, API key)
 * - POST /api/mcp/trip → Trip planning tools only
 * - POST /api/mcp/todo → Todo list tools only
 * - POST /api/mcp/fp → Financial planning tools only
 */

import {handleMcpGetForFeature, handleMcpPostForFeature} from '@/lib/api/mcp/handleMcpRequestByFeature';

interface RouteParams {
  params: {feature?: string[]};
}

export async function GET(request: Request, {params}: RouteParams): Promise<Response> {
  const feature = params.feature?.[0] as 'trip' | 'todo' | 'fp' | undefined;
  return handleMcpGetForFeature(request, feature ?? null);
}

export async function POST(request: Request, {params}: RouteParams): Promise<Response> {
  const feature = params.feature?.[0] as 'trip' | 'todo' | 'fp' | undefined;
  return handleMcpPostForFeature(request, feature ?? null);
}
