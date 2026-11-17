import {isSiteAdminHost, parseSiteAssetName, resolveSiteHost, type SiteHostResolution} from '@so/model';
import {NextResponse} from 'next/server';
import {copySiteAssetBytes, getDbSiteAsset, ownerIdForAssetHost, readStorageSiteAsset} from '@/lib/admin/siteAssetAccess';
import {readSitesPublicEnv} from '@/lib/env';

interface AssetRouteContext {
  readonly params: Promise<{name: string}>;
}

function ownerLookup(resolved: SiteHostResolution): {readonly slug?: string; readonly customDomain?: string} {
  if (resolved.kind === 'custom-domain') {
    return {customDomain: resolved.host};
  }
  if (resolved.kind === 'demo-subdomain' || resolved.kind === 'local') {
    return {slug: resolved.slug};
  }
  return {};
}

export async function GET(request: Request, context: AssetRouteContext): Promise<Response> {
  const {name: raw} = await context.params;
  let name = '';
  try {
    name = parseSiteAssetName(decodeURIComponent(raw));
  } catch {
    return NextResponse.json({error: 'Unknown asset'}, {status: 404});
  }
  const host = request.headers.get('x-site-host') ?? request.headers.get('host') ?? '';
  const rootDomain = readSitesPublicEnv().rootDomain;
  if (isSiteAdminHost(host, rootDomain)) {
    return NextResponse.json({error: 'Unknown asset'}, {status: 404});
  }
  const resolved = resolveSiteHost({host, rootDomain});
  const ownerId = await ownerIdForAssetHost(ownerLookup(resolved));
  if (ownerId === undefined) {
    return NextResponse.json({error: 'Unknown asset'}, {status: 404});
  }
  try {
    const asset = await getDbSiteAsset(ownerId, name);
    if (asset === undefined || asset.visibility !== 'public') {
      return NextResponse.json({error: 'Unknown asset'}, {status: 404});
    }
    const bytes = await readStorageSiteAsset(asset);
    return new NextResponse(copySiteAssetBytes(bytes), {
      headers: {
        'Content-Type': asset.contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({error: 'Unknown asset'}, {status: 404});
  }
}
