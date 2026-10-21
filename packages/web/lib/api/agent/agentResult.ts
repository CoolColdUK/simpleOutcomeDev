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

export function dbErr(error: {message: string} | null | undefined): AgentErr | undefined {
  if (error === undefined || error === null) {
    return undefined;
  }
  console.error('agent db', error.message);
  return agentErr(500, 'error', 'Request failed');
}
