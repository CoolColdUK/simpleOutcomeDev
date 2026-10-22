export interface AgentOk<T> {
  readonly ok: true;
  readonly data: T;
}

export interface AgentErr {
  readonly ok: false;
  readonly status: number;
  readonly code: string;
  readonly message: string;
}

export type AgentResult<T> = AgentOk<T> | AgentErr;

export function agentOk<T>(data: T): AgentOk<T> {
  return {ok: true, data};
}

export function agentErr(status: number, code: string, message: string): AgentErr {
  return {ok: false, status, code, message};
}

export function agentResultResponse<T>(result: AgentResult<T>): Response {
  if (!result.ok) {
    return Response.json({error: {code: result.code, message: result.message}}, {status: result.status});
  }
  return Response.json(result.data);
}

interface AgentDbError {
  readonly message: string;
  readonly code?: string;
  readonly details?: string;
  readonly hint?: string;
}

export function dbErr(error: AgentDbError | null | undefined): AgentErr | undefined {
  if (error === undefined || error === null) {
    return undefined;
  }
  console.error('agent db', {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
  const code = error.code?.trim();
  return agentErr(500, 'database_error', code === undefined || code === '' ? 'Database request failed' : `Database request failed (${code})`);
}

export function agentValidation(message: string): AgentErr {
  return agentErr(400, 'validation', message);
}

const RPC_MESSAGES: readonly {readonly needle: string; readonly status: number; readonly code: string}[] = [
  {needle: 'not found', status: 404, code: 'not_found'},
  {needle: 'invalid invite', status: 400, code: 'validation'},
  {needle: 'invite disabled', status: 400, code: 'validation'},
  {needle: 'invite expired', status: 400, code: 'validation'},
  {needle: 'invite already used', status: 400, code: 'validation'},
  {needle: 'invalid token', status: 400, code: 'validation'},
  {needle: 'pod is not open', status: 400, code: 'validation'},
  {needle: 'pod does not accept', status: 400, code: 'validation'},
  {needle: 'already a member', status: 400, code: 'validation'},
  {needle: 'user is not in this space', status: 400, code: 'validation'},
  {needle: 'account not in pod', status: 400, code: 'validation'},
  {needle: 'parser not in pod', status: 400, code: 'validation'},
  {needle: 'import already undone', status: 400, code: 'validation'},
  {needle: 'invalid feature', status: 400, code: 'validation'},
  {needle: 'invalid visibility', status: 400, code: 'validation'},
  {needle: 'not allowed', status: 403, code: 'forbidden'},
];

export function rpcErr(error: {message: string} | null | undefined): AgentErr | undefined {
  if (error === undefined || error === null) {
    return undefined;
  }
  const message = error.message.toLowerCase();
  const known = RPC_MESSAGES.find((item) => message.includes(item.needle));
  if (known !== undefined) {
    return agentErr(known.status, known.code, error.message);
  }
  return dbErr(error);
}
