import {BOOK_MCP_TOOL_COUNT, BOOK_MCP_TOOL_NAMES} from '../book/bookMcpToolCatalog';

export default function buildApiKeyAiSetupPrompt(webUrl: string): string {
  const base = webUrl.replace(/\/$/, '');
  const bookTools = BOOK_MCP_TOOL_NAMES.join(', ');
  return [
    'Connect SimpleOutcome over hosted MCP. Put the API key in an environment variable.',
    `Core URL: ${base}/api/mcp`,
    `Book pod URL: ${base}/api/mcp/book (${BOOK_MCP_TOOL_COUNT} tools)`,
    `Book tools: ${bookTools}`,
    'Transport: Streamable HTTP',
    'Header: Authorization: Bearer ${SIMPLEOUTCOME_API_KEY}',
    'Do not paste the raw API key into a prompt. Store it as SIMPLEOUTCOME_API_KEY.',
  ].join('\n');
}
