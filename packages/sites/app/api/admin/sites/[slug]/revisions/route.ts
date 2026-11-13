import {NextResponse} from 'next/server';
import {listRevisions} from '@/lib/admin/publishSite';
import {requireAdminHostApi} from '@/lib/admin/requireAdminHost';
import {canManageSite, loadOwnedSiteBySlug} from '@/lib/admin/siteAccess';
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
  const revisions = await listRevisions(site.id);
  return NextResponse.json({
    site,
    revisions: revisions.map((row) => ({
      versionNumber: row.version_number,
      publishedAt: row.published_at,
      publishedBy: row.published_by,
      businessName: row.document.businessName,
    })),
  });
}
