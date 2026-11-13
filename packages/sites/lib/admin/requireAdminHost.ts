import {isSiteAdminHost} from '@so/model';
import {notFound} from 'next/navigation';
import {NextResponse} from 'next/server';
import {readSitesPublicEnv} from '@/lib/env';
import readRequestHost from '@/lib/site/readRequestHost';

export async function requireAdminHostPage(): Promise<void> {
  const host = await readRequestHost();
  const env = readSitesPublicEnv();
  if (!isSiteAdminHost(host, env.rootDomain)) {
    notFound();
  }
}

export async function requireAdminHostApi(): Promise<Response | undefined> {
  const host = await readRequestHost();
  const env = readSitesPublicEnv();
  if (!isSiteAdminHost(host, env.rootDomain)) {
    return NextResponse.json({error: 'Not found'}, {status: 404});
  }
  return undefined;
}

export function adminOrigin(host: string): string {
  const local = host.includes('localhost') || host.startsWith('127.0.0.1');
  return `${local ? 'http' : 'https'}://${host}`;
}
