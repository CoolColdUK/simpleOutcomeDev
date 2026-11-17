import {NextResponse} from 'next/server';
import {adminApiDenied, requireAdminApi} from '@/lib/admin/requireAdminApi';
import {createStorageSiteAsset, listDbSiteAssets, renameDbSiteAsset} from '@/lib/admin/siteAssetAccess';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ownerIdFrom(value: string | null): string | undefined {
  if (value === null || !UUID.test(value)) {
    return undefined;
  }
  return value;
}

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminApi();
  if (adminApiDenied(auth)) {
    return auth;
  }
  const ownerId = ownerIdFrom(new URL(request.url).searchParams.get('ownerId'));
  if (ownerId === undefined) {
    return NextResponse.json({error: 'Choose a client'}, {status: 400});
  }
  try {
    const assets = await listDbSiteAssets(ownerId);
    return NextResponse.json({assets});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not list assets';
    return NextResponse.json({error: message}, {status: 400});
  }
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAdminApi();
  if (adminApiDenied(auth)) {
    return auth;
  }
  const form = await request.formData();
  const ownerId = ownerIdFrom(typeof form.get('ownerId') === 'string' ? String(form.get('ownerId')) : null);
  const file = form.get('file');
  const nameField = form.get('name');
  if (ownerId === undefined || !(file instanceof File)) {
    return NextResponse.json({error: 'Choose a client and a file'}, {status: 400});
  }
  const name = typeof nameField === 'string' && nameField.trim().length > 0 ? nameField : file.name;
  try {
    const asset = await createStorageSiteAsset({ownerId, name, bytes: new Uint8Array(await file.arrayBuffer())});
    return NextResponse.json({asset});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not upload the asset';
    return NextResponse.json({error: message}, {status: 400});
  }
}

export async function PATCH(request: Request): Promise<Response> {
  const auth = await requireAdminApi();
  if (adminApiDenied(auth)) {
    return auth;
  }
  const body = (await request.json().catch(() => undefined)) as {ownerId?: string; name?: string; nextName?: string} | undefined;
  const ownerId = ownerIdFrom(body?.ownerId ?? null);
  if (ownerId === undefined || typeof body?.name !== 'string' || typeof body.nextName !== 'string') {
    return NextResponse.json({error: 'Choose a client and both names'}, {status: 400});
  }
  try {
    const asset = await renameDbSiteAsset(ownerId, body.name, body.nextName);
    return NextResponse.json({asset});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not rename the asset';
    return NextResponse.json({error: message}, {status: 400});
  }
}
