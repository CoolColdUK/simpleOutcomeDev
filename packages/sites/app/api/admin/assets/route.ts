import {NextResponse} from 'next/server';
import {adminApiDenied, requireAdminApi} from '@/lib/admin/requireAdminApi';
import {createStorageSiteAsset, listDbSiteAssets, updateDbSiteAsset} from '@/lib/admin/siteAssetAccess';

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
  const description = form.get('description');
  const visibility = form.get('visibility');
  if (ownerId === undefined || !(file instanceof File) || typeof description !== 'string' || typeof visibility !== 'string') {
    return NextResponse.json({error: 'Choose a client, a file, a description, and private or public'}, {status: 400});
  }
  const name = typeof nameField === 'string' && nameField.trim().length > 0 ? nameField : file.name;
  try {
    const asset = await createStorageSiteAsset({
      ownerId,
      name,
      description,
      visibility,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
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
  const body = (await request.json().catch(() => undefined)) as
    | {ownerId?: string; name?: string; nextName?: string; description?: string; visibility?: string}
    | undefined;
  const ownerId = ownerIdFrom(body?.ownerId ?? null);
  if (ownerId === undefined || typeof body?.name !== 'string') {
    return NextResponse.json({error: 'Choose a client and an asset'}, {status: 400});
  }
  try {
    const asset = await updateDbSiteAsset(ownerId, body.name, {
      nextName: typeof body.nextName === 'string' ? body.nextName : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      visibility: typeof body.visibility === 'string' ? body.visibility : undefined,
    });
    return NextResponse.json({asset});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update the asset';
    return NextResponse.json({error: message}, {status: 400});
  }
}
