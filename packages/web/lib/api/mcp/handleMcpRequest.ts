import {agentResultResponse, type AgentResult} from '@/lib/api/agent/agentResult';
import loadAgentContext from '@/lib/api/agent/loadAgentContext';
import {findMcpTool, MCP_TOOLS} from '@/lib/api/mcp/mcpCatalog';

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

function toolResponse(id: unknown, result: AgentResult<unknown>): Response {
  if (!result.ok && (result.status === 401 || result.status === 503)) {
    return agentResultResponse(result);
  }
  if (!result.ok) {
    return rpcResult(id, {
      content: [{type: 'text', text: JSON.stringify({error: {code: result.code, message: result.message}})}],
      isError: true,
    });
  }
  return rpcResult(id, {content: [{type: 'text', text: JSON.stringify(result.data)}], isError: false});
}

export async function handleMcpGet(request: Request): Promise<Response> {
  const ctx = await loadAgentContext(request);
  if (!ctx.ok) {
    return agentResultResponse(ctx);
  }
  const accept = request.headers.get('accept') ?? '';
  if (accept.includes('text/event-stream')) {
    return new Response(': keepalive\n\n', {
      status: 200,
      headers: {'content-type': 'text/event-stream', 'cache-control': 'no-cache, no-transform'},
    });
  }
  return Response.json({transport: 'streamable-http', endpoint: '/api/mcp'});
}

export async function handleMcpPost(request: Request): Promise<Response> {
  const ctx = await loadAgentContext(request);
  if (!ctx.ok) {
    return agentResultResponse(ctx);
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
      serverInfo: {name: 'simpleoutcome', version: '0.20.0'},
    });
  }
  if (body.method === 'ping') {
    return rpcResult(body.id, {});
  }
  if (body.method === 'tools/list') {
    return rpcResult(body.id, {
      tools: MCP_TOOLS.map((item) => ({name: item.name, description: item.description, inputSchema: item.inputSchema})),
    });
  }
  if (body.method === 'tools/call') {
    const params = typeof body.params === 'object' && body.params !== null ? (body.params as {name?: unknown; arguments?: unknown}) : undefined;
    const name = typeof params?.name === 'string' ? params.name : '';
    const tool = findMcpTool(name, MCP_TOOLS);
    if (tool === undefined) {
      return rpcError(body.id, -32602, 'Unknown tool');
    }
    const result = await tool.run(request, params?.arguments ?? {});
    return toolResponse(body.id, result);
  }
  return rpcError(body.id, -32601, 'Method not found');
}
