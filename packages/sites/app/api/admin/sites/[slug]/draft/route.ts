import {parseSiteDocument} from '@so/model';
import {NextResponse} from 'next/server';
import {requireAdminHostApi} from '@/lib/admin/requireAdminHost';
import {canManageSite, loadDraftDocument, loadOwnedSiteBySlug, saveDraftDocument} from '@/lib/admin/siteAccess';
import {loadSiteSession} from '@/lib/admin/siteSession';
import {readSiteSessionCookie} from '@/lib/admin/siteSessionCookie';

interface RouteParams {
  params: Promise<{slug: string}>;
}

export async function GET(_request: Request, {params}: RouteParams): Promise<Response> {
  const blocked = await requireAdminHostApi();
  if (blocked !== undefined) {
    return blocked;
  }
  const raw = await readSiteSessionCookie();
  if (raw === undefined) {
    return NextResponse.json({error: 'Sign in required'}, {status: 401});
  }
  const session = await loadSiteSession(raw);
  if (session === undefined) {
    return NextResponse.json({error: 'Sign in required'}, {status: 401});
  }
  const {slug} = await params;
  const site = await loadOwnedSiteBySlug(slug);
  if (site === undefined || !canManageSite(session, site)) {
    return NextResponse.json({error: 'Not found'}, {status: 404});
  }
  const document = await loadDraftDocument(site.id);
  if (document === undefined) {
    return NextResponse.json({error: 'Draft not found'}, {status: 404});
  }
  return NextResponse.json({site, document});
}

export async function PUT(request: Request, {params}: RouteParams): Promise<Response> {
  const blocked = await requireAdminHostApi();
  if (blocked !== undefined) {
    return blocked;
  }
  const raw = await readSiteSessionCookie();
  if (raw === undefined) {
    return NextResponse.json({error: 'Sign in required'}, {status: 401});
  }
  const session = await loadSiteSession(raw);
  if (session === undefined) {
    return NextResponse.json({error: 'Sign in required'}, {status: 401});
  }
  const {slug} = await params;
  const site = await loadOwnedSiteBySlug(slug);
  if (site === undefined || !canManageSite(session, site)) {
    return NextResponse.json({error: 'Not found'}, {status: 404});
  }
  const body = (await request.json().catch(() => undefined)) as {document?: unknown} | undefined;
  let document;
  try {
    document = parseSiteDocument(body?.document);
  } catch (err) {
    return NextResponse.json({error: err instanceof Error ? err.message : 'Invalid document'}, {status: 400});
  }
  await saveDraftDocument(site.id, document);
  return NextResponse.json({ok: true, document});
}
