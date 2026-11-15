import {parseSiteDocument} from '@so/model';
import {NextResponse} from 'next/server';
import {requireAdminHostApi} from '@/lib/admin/requireAdminHost';
import {actingIsAdmin} from '@/lib/admin/requireSiteSession';
import {createSiteForOwner, listSitesForUser} from '@/lib/admin/siteAccess';
import {getSiteTemplate, SITE_TEMPLATE_ID_RE} from '@/lib/admin/siteTemplateAccess';
import {loadSiteSession} from '@/lib/admin/siteSession';
import {readSiteSessionCookie} from '@/lib/admin/siteSessionCookie';
import createSitesServiceClient from '@/lib/supabase/createSitesServiceClient';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const OWNER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(): Promise<Response> {
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
  const sites = await listSitesForUser(session.user.id, actingIsAdmin(session));
  return NextResponse.json({sites});
}

export async function POST(request: Request): Promise<Response> {
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
  if (!actingIsAdmin(session)) {
    return NextResponse.json({error: 'Only admins can create sites'}, {status: 403});
  }
  const body = (await request.json().catch(() => undefined)) as {
    slug?: unknown;
    preset?: unknown;
    document?: unknown;
    customDomain?: unknown;
    ownerId?: unknown;
  } | undefined;
  const slug = typeof body?.slug === 'string' ? body.slug.trim().toLowerCase() : '';
  const presetRaw = typeof body?.preset === 'string' ? body.preset.trim().toLowerCase() : '';
  const customDomain =
    typeof body?.customDomain === 'string' && body.customDomain.trim().length > 0
      ? body.customDomain.trim().toLowerCase()
      : undefined;
  const ownerId = typeof body?.ownerId === 'string' ? body.ownerId.trim() : '';
  if (!SLUG_RE.test(slug) || slug.length > 63) {
    return NextResponse.json({error: 'Invalid slug'}, {status: 400});
  }
  if (!SITE_TEMPLATE_ID_RE.test(presetRaw)) {
    return NextResponse.json({error: 'Invalid template'}, {status: 400});
  }
  if (!OWNER_ID_RE.test(ownerId)) {
    return NextResponse.json({error: 'Choose an owner'}, {status: 400});
  }
  const supabase = createSitesServiceClient();
  const {data: owner, error: ownerError} = await supabase
    .from('site_user')
    .select('id, is_admin')
    .eq('id', ownerId)
    .maybeSingle();
  if (ownerError || owner === null) {
    return NextResponse.json({error: 'Owner not found'}, {status: 400});
  }
  if ((owner as {is_admin: boolean}).is_admin) {
    return NextResponse.json({error: 'Admins manage users and do not own sites'}, {status: 400});
  }

  const template = await getSiteTemplate(presetRaw);
  if (template === undefined) {
    return NextResponse.json({error: 'Template not found'}, {status: 400});
  }
  let document;
  try {
    document = body?.document === undefined ? template.document : parseSiteDocument(body.document);
  } catch (err) {
    return NextResponse.json({error: err instanceof Error ? err.message : 'Invalid document'}, {status: 400});
  }
  try {
    const site = await createSiteForOwner({
      slug,
      ownerId,
      preset: presetRaw,
      document,
      customDomain,
    });
    return NextResponse.json({site});
  } catch (err) {
    return NextResponse.json({error: err instanceof Error ? err.message : 'Could not create site'}, {status: 400});
  }
}
