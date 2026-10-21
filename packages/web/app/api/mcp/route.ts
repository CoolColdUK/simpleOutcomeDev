import {handleMcpGet, handleMcpPost} from '@/lib/api/mcp/handleMcpRequest';

export async function GET(request: Request): Promise<Response> {
  return handleMcpGet(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleMcpPost(request);
}
