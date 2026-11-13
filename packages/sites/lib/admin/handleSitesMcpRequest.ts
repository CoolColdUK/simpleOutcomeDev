import {NextResponse} from 'next/server';
import {loadSiteApiKeyUser} from '@/lib/admin/loadSiteApiKey';
import {requireAdminHostApi} from '@/lib/admin/requireAdminHost';
import {callSitesMcpTool, SITES_MCP_TOOLS} from '@/lib/admin/sitesMcp';

interface JsonRpc {
  readonly jsonrpc?: unknown;
  readonly id?: unknown;
  readonly method?: unknown;
  readonly params?: unknown;
}

function rpcResult(id: unknown, result: unknown): Response {
  return Response.json({jsonrpc: '2.0', id, result});
}

function rpcError(id: unknown, code: number, message: string): Response {
  return Response.json({jsonrpc: '2.0', id, error: {code, message}});
}

export type SitesMcpFeature = 'sites';

export function parseSitesMcpFeature(segments: string[] | undefined): SitesMcpFeature | null | 'unknown' {
  if (segments === undefined || segments.length === 0) {
    return null;
  }
  if (segments.length === 1 && segments[0] === 'sites') {
    return 'sites';
  }
  return 'unknown';
}

async function authorize(request: Request): Promise<Response | undefined> {
  const blocked = await requireAdminHostApi();
  if (blocked !== undefined) {
    return blocked;
  }
  const user = await loadSiteApiKeyUser(request.headers.get('authorization'));
  if (user === undefined) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  }
  return undefined;
}

export async function handleSitesMcpGet(request: Request, feature: SitesMcpFeature | null | 'unknown'): Promise<Response> {
  const denied = await authorize(request);
  if (denied !== undefined) {
    return denied;
  }
  if (feature === 'unknown') {
    return NextResponse.json({error: 'Unknown MCP feature'}, {status: 404});
  }
  if (feature === null) {
    return Response.json({
      transport: 'streamable-http',
      endpoints: {sites: '/api/mcp/sites'},
      note: 'Feature-scoped like the main app /api/mcp/book. Use /api/mcp/sites.',
    });
  }
  return Response.json({transport: 'streamable-http', endpoint: '/api/mcp/sites'});
}

export async function handleSitesMcpPost(request: Request, feature: SitesMcpFeature | null | 'unknown'): Promise<Response> {
  const denied = await authorize(request);
  if (denied !== undefined) {
    return denied;
  }
  if (feature === 'unknown') {
    return NextResponse.json({error: 'Unknown MCP feature'}, {status: 404});
  }
  if (feature === null) {
    return NextResponse.json(
      {error: 'Use /api/mcp/sites for site tools (same split as /api/mcp/book on the main app)'},
      {status: 400},
    );
  }
  const body = (await request.json().catch(() => undefined)) as JsonRpc | undefined;
  if (body === undefined || Array.isArray(body) || body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
    return rpcError(null, -32600, 'Invalid request');
  }
  if (body.method.startsWith('notifications/')) {
    return new Response(null, {status: 202});
  }
  if (body.method === 'initialize') {
    return rpcResult(body.id, {
      protocolVersion: '2025-03-26',
      capabilities: {tools: {listChanged: false}},
      serverInfo: {name: 'simpleoutcome-sites', version: '0.49.0'},
    });
  }
  if (body.method === 'ping') {
    return rpcResult(body.id, {});
  }
  if (body.method === 'tools/list') {
    return rpcResult(body.id, {
      tools: SITES_MCP_TOOLS.map((item) => ({
        name: item.name,
        description: item.description,
        inputSchema: item.inputSchema,
      })),
    });
  }
  if (body.method === 'tools/call') {
    const params =
      typeof body.params === 'object' && body.params !== null
        ? (body.params as {name?: unknown; arguments?: unknown})
        : undefined;
    const name = typeof params?.name === 'string' ? params.name : '';
    const args =
      typeof params?.arguments === 'object' && params.arguments !== null && !Array.isArray(params.arguments)
        ? (params.arguments as Record<string, unknown>)
        : {};
    try {
      const data = await callSitesMcpTool(name, args);
      return rpcResult(body.id, {content: [{type: 'text', text: JSON.stringify(data)}], isError: false});
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return rpcResult(body.id, {
        content: [{type: 'text', text: JSON.stringify({error: {message}})}],
        isError: true,
      });
    }
  }
  return rpcError(body.id, -32601, 'Method not found');
}
