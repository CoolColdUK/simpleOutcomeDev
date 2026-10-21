import dispatchAgentRest from '@/lib/api/agent/dispatchAgentRest';

interface AgentRouteContext {
  readonly params: Promise<{readonly path: string[]}>;
}

async function handle(method: string, request: Request, context: AgentRouteContext): Promise<Response> {
  const {path} = await context.params;
  return dispatchAgentRest(method, request, path);
}

export function GET(request: Request, context: AgentRouteContext): Promise<Response> {
  return handle('GET', request, context);
}

export function POST(request: Request, context: AgentRouteContext): Promise<Response> {
  return handle('POST', request, context);
}

export function PATCH(request: Request, context: AgentRouteContext): Promise<Response> {
  return handle('PATCH', request, context);
}

export function DELETE(request: Request, context: AgentRouteContext): Promise<Response> {
  return handle('DELETE', request, context);
}
