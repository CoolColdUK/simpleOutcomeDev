export default function buildApiKeyAiSetupPrompt(webUrl: string): string {
  const base = webUrl.replace(/\/$/, '');
  return [
    'Connect SimpleOutcome over hosted MCP. Put the API key in an environment variable.',
    `URL: ${base}/api/mcp`,
    'Transport: Streamable HTTP',
    'Header: Authorization: Bearer ${SIMPLEOUTCOME_API_KEY}',
    'Do not paste the raw API key into a prompt. Store it as SIMPLEOUTCOME_API_KEY.',
  ].join('\n');
}
