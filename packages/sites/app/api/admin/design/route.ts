import {NextResponse} from 'next/server';
import {adminApiDenied, requireAdminApi} from '@/lib/admin/requireAdminApi';
import {listDesignLibrary} from '@/lib/admin/designLibraryAccess';

export async function GET(): Promise<Response> {
  const session = await requireAdminApi();
  if (adminApiDenied(session)) {
    return session;
  }
  try {
    const library = await listDesignLibrary();
    return NextResponse.json(library);
  } catch (err) {
    return NextResponse.json({error: err instanceof Error ? err.message : 'Could not load the design library'}, {status: 500});
  }
}
