import {parseDesignTemplateItems, parseSiteDocument} from '@so/model';
import {NextResponse} from 'next/server';
import {adminApiDenied, requireAdminApi} from '@/lib/admin/requireAdminApi';
import {deleteSiteTemplate, getSiteTemplate, templateNameOk, updateSiteTemplate} from '@/lib/admin/siteTemplateAccess';

export async function GET(_request: Request, context: {params: Promise<{id: string}>}): Promise<Response> {
  const session = await requireAdminApi();
  if (adminApiDenied(session)) {
    return session;
  }
  const {id} = await context.params;
  try {
    const template = await getSiteTemplate(id);
    if (template === undefined) {
      return NextResponse.json({error: 'Template not found'}, {status: 404});
    }
    return NextResponse.json({template});
  } catch (err) {
    return NextResponse.json({error: err instanceof Error ? err.message : 'Could not read template'}, {status: 400});
  }
}

export async function PUT(request: Request, context: {params: Promise<{id: string}>}): Promise<Response> {
  const session = await requireAdminApi();
  if (adminApiDenied(session)) {
    return session;
  }
  const {id} = await context.params;
  const body = (await request.json().catch(() => undefined)) as {name?: unknown; document?: unknown; colourSchemeId?: unknown; items?: unknown} | undefined;
  const name = typeof body?.name === 'string' ? body.name.trim() : undefined;
  const colourSchemeId = typeof body?.colourSchemeId === 'string' ? body.colourSchemeId.trim().toLowerCase() : undefined;
  if (name !== undefined && !templateNameOk(name)) {
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
  let items;
  if (body?.items !== undefined) {
    try {
      items = parseDesignTemplateItems(body.items);
    } catch (err) {
      return NextResponse.json({error: err instanceof Error ? err.message : 'Invalid molecule items'}, {status: 400});
    }
  }
  if (name === undefined && document === undefined && colourSchemeId === undefined && items === undefined) {
    return NextResponse.json({error: 'Nothing to update'}, {status: 400});
  }
  try {
    const template = await updateSiteTemplate(id, {name, document, colourSchemeId, items});
    return NextResponse.json({template});
  } catch (err) {
    return NextResponse.json({error: err instanceof Error ? err.message : 'Could not update template'}, {status: 400});
  }
}

export async function DELETE(_request: Request, context: {params: Promise<{id: string}>}): Promise<Response> {
  const session = await requireAdminApi();
  if (adminApiDenied(session)) {
    return session;
  }
  const {id} = await context.params;
  try {
    await deleteSiteTemplate(id);
    return NextResponse.json({ok: true});
  } catch (err) {
    return NextResponse.json({error: err instanceof Error ? err.message : 'Could not delete template'}, {status: 400});
  }
}
