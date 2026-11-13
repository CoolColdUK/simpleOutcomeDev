/**
 * Feature-scoped sites MCP (same idea as main app /api/mcp/book).
 *
 * - GET/POST /api/mcp → lists the sites endpoint; tools live under /sites
 * - GET/POST /api/mcp/sites → site draft tools only
 */

import {handleSitesMcpGet, handleSitesMcpPost, parseSitesMcpFeature} from '@/lib/admin/handleSitesMcpRequest';

interface RouteParams {
  params: Promise<{feature?: string[]}>;
}

export async function GET(request: Request, {params}: RouteParams): Promise<Response> {
  const {feature} = await params;
  return handleSitesMcpGet(request, parseSitesMcpFeature(feature));
}

export async function POST(request: Request, {params}: RouteParams): Promise<Response> {
  const {feature} = await params;
  return handleSitesMcpPost(request, parseSitesMcpFeature(feature));
}
