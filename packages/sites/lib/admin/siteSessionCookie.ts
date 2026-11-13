import {cookies} from 'next/headers';

export const SITE_SESSION_COOKIE = 'site_session';
export const SITE_SESSION_DAYS = 14;

export function siteSessionMaxAgeSeconds(): number {
  return SITE_SESSION_DAYS * 24 * 60 * 60;
}

export async function readSiteSessionCookie(): Promise<string | undefined> {
  const jar = await cookies();
  const value = jar.get(SITE_SESSION_COOKIE)?.value;
  if (value === undefined || value.length === 0) {
    return undefined;
  }
  return value;
}

export async function writeSiteSessionCookie(rawToken: string): Promise<void> {
  const jar = await cookies();
  jar.set(SITE_SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: siteSessionMaxAgeSeconds(),
  });
}

export async function clearSiteSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SITE_SESSION_COOKIE);
}
