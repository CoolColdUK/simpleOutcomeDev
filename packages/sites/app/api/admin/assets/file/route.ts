import {NextResponse} from 'next/server';
import {adminApiDenied, requireAdminApi} from '@/lib/admin/requireAdminApi';
import {copySiteAssetBytes, getDbSiteAsset, readStorageSiteAsset} from '@/lib/admin/siteAssetAccess';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminApi();
  if (adminApiDenied(auth)) {
    return auth;
  }
  const url = new URL(request.url);
  const ownerId = url.searchParams.get('ownerId') ?? '';
  const name = url.searchParams.get('name') ?? '';
  if (!UUID.test(ownerId) || name.length === 0) {
    return NextResponse.json({error: 'Choose a client and an asset'}, {status: 400});
  }
  try {
    const asset = await getDbSiteAsset(ownerId, name);
    if (asset === undefined) {
      return NextResponse.json({error: 'Asset not found'}, {status: 404});
    }
    const bytes = await readStorageSiteAsset(asset);
    return new NextResponse(copySiteAssetBytes(bytes), {
      headers: {
        'Content-Type': asset.contentType,
        'Content-Disposition': `inline; filename="${asset.name}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not read the asset';
    return NextResponse.json({error: message}, {status: 400});
  }
}
