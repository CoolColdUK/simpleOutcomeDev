import {parseSiteDocument} from '@so/model';
import {NextResponse} from 'next/server';
import {adminApiDenied, requireAdminApi} from '@/lib/admin/requireAdminApi';
import {createSiteTemplate, listSiteTemplates, SITE_TEMPLATE_ID_RE, templateNameOk} from '@/lib/admin/siteTemplateAccess';

export async function GET(): Promise<Response> {
  const session = await requireAdminApi();
  if (adminApiDenied(session)) {
    return session;
  }
  try {
    const templates = await listSiteTemplates();
    return NextResponse.json({templates});
  } catch (err) {
    return NextResponse.json({error: err instanceof Error ? err.message : 'Could not list templates'}, {status: 500});
  }
}

export async function POST(request: Request): Promise<Response> {
  const session = await requireAdminApi();
  if (adminApiDenied(session)) {
    return session;
  }
  const body = (await request.json().catch(() => undefined)) as {id?: unknown; name?: unknown; document?: unknown} | undefined;
  const id = typeof body?.id === 'string' ? body.id.trim().toLowerCase() : '';
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!SITE_TEMPLATE_ID_RE.test(id)) {
    return NextResponse.json({error: 'Invalid template id'}, {status: 400});
  }
  if (!templateNameOk(name)) {
    return NextResponse.json({error: 'Name is required'}, {status: 400});
  }
  let document;
  if (body?.document !== undefined) {
    try {
      document = parseSiteDocument(body.document);
    } catch (err) {
      return NextResponse.json({error: err instanceof Error ? err.message : 'Invalid document'}, {status: 400});
    }
  }
  try {
    const template = await createSiteTemplate({id, name, document});
    return NextResponse.json({template});
  } catch (err) {
    return NextResponse.json({error: err instanceof Error ? err.message : 'Could not create template'}, {status: 400});
  }
}
