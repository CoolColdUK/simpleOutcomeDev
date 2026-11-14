export interface ResolveSiteHostInput {
  readonly host: string;
  readonly rootDomain: string;
}

export interface SiteHostDemoSubdomain {
  readonly kind: 'demo-subdomain';
  readonly slug: string;
}

export interface SiteHostLocal {
  readonly kind: 'local';
  readonly slug: string;
}

export interface SiteHostCustomDomain {
  readonly kind: 'custom-domain';
  readonly host: string;
}

export interface SiteHostUnknown {
  readonly kind: 'unknown';
}

export type SiteHostResolution = SiteHostDemoSubdomain | SiteHostLocal | SiteHostCustomDomain | SiteHostUnknown;

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const HOSTNAME = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function normaliseSiteHost(host: string): string {
  const trimmed = host.trim().toLowerCase().replace(/\.$/, '');
  const colon = trimmed.lastIndexOf(':');
  if (colon > -1 && /^\d+$/.test(trimmed.slice(colon + 1))) {
    return trimmed.slice(0, colon);
  }
  return trimmed;
}

function slugUnder(host: string, suffix: string): string | undefined {
  if (!host.endsWith(suffix) || host.length <= suffix.length) {
    return undefined;
  }
  return host.slice(0, -suffix.length);
}

export function resolveSiteHost(input: ResolveSiteHostInput): SiteHostResolution {
  const host = normaliseSiteHost(input.host);
  const rootDomain = normaliseSiteHost(input.rootDomain);
  if (host.length === 0 || rootDomain.length === 0) {
    return {kind: 'unknown'};
  }
  if (host === rootDomain || host === `www.${rootDomain}` || host.endsWith('.vercel.app')) {
    return {kind: 'unknown'};
  }
  const demoSlug = slugUnder(host, `.${rootDomain}`);
  if (demoSlug !== undefined) {
    // Reserved: admin.simpleoutcome.dev and the staging editor admindev.simpleoutcome.dev.
    if (demoSlug === 'admin' || demoSlug === 'admindev' || demoSlug === 'dev') {
      return {kind: 'unknown'};
    }
    if (SLUG.test(demoSlug)) {
      return {kind: 'demo-subdomain', slug: demoSlug};
    }
    return {kind: 'unknown'};
  }
  const localSlug = slugUnder(host, '.localhost');
  if (localSlug !== undefined) {
    if (localSlug === 'admin') {
      return {kind: 'unknown'};
    }
    if (SLUG.test(localSlug)) {
      return {kind: 'local', slug: localSlug};
    }
    return {kind: 'unknown'};
  }
  if (HOSTNAME.test(host)) {
    return {kind: 'custom-domain', host};
  }
  return {kind: 'unknown'};
}
