import {NextResponse} from 'next/server';
import {requireAdminHostApi} from '@/lib/admin/requireAdminHost';
import {deleteSiteSessionByToken} from '@/lib/admin/siteSession';
import {clearSiteSessionCookie, readSiteSessionCookie} from '@/lib/admin/siteSessionCookie';

export async function POST(): Promise<Response> {
  const blocked = await requireAdminHostApi();
  if (blocked !== undefined) {
    return blocked;
  }
  const raw = await readSiteSessionCookie();
  if (raw !== undefined) {
    await deleteSiteSessionByToken(raw);
  }
  await clearSiteSessionCookie();
  return NextResponse.json({ok: true});
}
