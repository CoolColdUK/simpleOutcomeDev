import {isSiteAdminHost, resolveSiteHost} from '@so/model';
import {NextResponse, type NextRequest} from 'next/server';

const DEFAULT_ROOT_DOMAIN = 'simpleoutcome.dev';

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const rootDomain = process.env.NEXT_PUBLIC_SITES_ROOT_DOMAIN?.trim() || DEFAULT_ROOT_DOMAIN;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-site-host', host);

  if (isSiteAdminHost(host, rootDomain)) {
    const response = NextResponse.next({request: {headers: requestHeaders}});
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  const resolved = resolveSiteHost({host, rootDomain});
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next({request: {headers: requestHeaders}});
  }
  const url = request.nextUrl.clone();
  if (url.pathname !== '/') {
    url.pathname = '/';
  }
  const response = NextResponse.rewrite(url, {request: {headers: requestHeaders}});
  if (resolved.kind === 'demo-subdomain' || resolved.kind === 'local') {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
