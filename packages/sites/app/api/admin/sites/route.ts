import {parseSiteDocument, SITE_PRESET_IDS, SITE_PRESETS, type SitePresetId} from '@so/model';
import {NextResponse} from 'next/server';
import {requireAdminHostApi} from '@/lib/admin/requireAdminHost';
import {actingIsAdmin} from '@/lib/admin/requireSiteSession';
import {createSiteForOwner, listSitesForUser} from '@/lib/admin/siteAccess';
import {loadSiteSession} from '@/lib/admin/siteSession';
import {readSiteSessionCookie} from '@/lib/admin/siteSessionCookie';

function isPresetId(value: string): value is SitePresetId {
  return SITE_PRESET_IDS.some((id) => id === value);
}

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
    return NextResponse.json({error: 'Admin only'}, {status: 403});
  }
  const body = (await request.json().catch(() => undefined)) as {
    slug?: unknown;
    ownerEmail?: unknown;
    preset?: unknown;
    document?: unknown;
    customDomain?: unknown;
  } | undefined;
  const slug = typeof body?.slug === 'string' ? body.slug.trim().toLowerCase() : '';
  const ownerEmail = typeof body?.ownerEmail === 'string' ? body.ownerEmail.trim().toLowerCase() : '';
  const presetRaw = typeof body?.preset === 'string' ? body.preset : '';
  const customDomain =
    typeof body?.customDomain === 'string' && body.customDomain.trim().length > 0
      ? body.customDomain.trim().toLowerCase()
      : undefined;
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(slug)) {
    return NextResponse.json({error: 'Invalid slug'}, {status: 400});
  }
  if (!isPresetId(presetRaw)) {
    return NextResponse.json({error: 'Invalid preset'}, {status: 400});
  }
  if (ownerEmail.length === 0) {
    return NextResponse.json({error: 'ownerEmail is required'}, {status: 400});
  }
  let document;
  try {
    document =
      body?.document === undefined ? parseSiteDocument(SITE_PRESETS[presetRaw]) : parseSiteDocument(body.document);
  } catch (err) {
    return NextResponse.json({error: err instanceof Error ? err.message : 'Invalid document'}, {status: 400});
  }
  try {
    const site = await createSiteForOwner({slug, ownerEmail, preset: presetRaw, document, customDomain});
    return NextResponse.json({site});
  } catch (err) {
    return NextResponse.json({error: err instanceof Error ? err.message : 'Could not create site'}, {status: 400});
  }
}
