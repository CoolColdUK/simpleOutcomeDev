import {safeParseContactRequest} from '@so/model';

async function readJsonBody(request: Request): Promise<unknown | undefined> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export async function POST(request: Request): Promise<Response> {
  const body = await readJsonBody(request);
  const parsed = safeParseContactRequest(body);
  if (parsed === undefined) {
    return Response.json({error: 'Invalid contact request'}, {status: 400});
  }

  console.info('contact stub (not persisted)', {
    name: parsed.name,
    email: parsed.email,
  });

  return Response.json({ok: true});
}
