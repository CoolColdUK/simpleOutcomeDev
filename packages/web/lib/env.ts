/**
 * Public env (`NEXT_PUBLIC_*`) and site configuration, inlined at build time.
 * Missing Supabase values throw when this module loads so misconfiguration fails immediately.
 */

import removeStringTrailingSlash from './utils/string/removeStringTrailingSlash';
import throwIfUndefined from './utils/throwIfUndefined';
import trimStringOptional from './utils/string/trimStringOptional';

export interface PublicSupabaseEnv {
  readonly url: string;
  readonly anonKey: string;
}

export interface SiteConfig {
  readonly appName: string;
  readonly defaultTitle: string;
  readonly description: string;
  readonly keywords: string;
  readonly webUrl: string;
}

const SITE_APP_NAME = 'SimpleOutcome';
const SITE_DEFAULT_TITLE = 'SimpleOutcome - Innovative Digital Solutions & Portfolio';
const SITE_DESCRIPTION =
  'SimpleOutcome creates innovative digital solutions including CraftySmile (e-commerce management) and GoalJar (personal finance tracking). Professional portfolio showcasing web development and product design expertise.';
const SITE_KEYWORDS =
  'SimpleOutcome, portfolio, web development, digital solutions, e-commerce management, personal finance, CraftySmile, GoalJar, software development, product design, React, Next.js, TypeScript';

const DEFAULT_WEB_URL = 'https://simpleoutcome.dev';

function resolvePublicSupabase(): PublicSupabaseEnv | undefined {
  const url = trimStringOptional(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = trimStringOptional(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (url !== undefined && anonKey !== undefined) {
    return {url, anonKey};
  }
  return undefined;
}

const webUrl = removeStringTrailingSlash(trimStringOptional(process.env.NEXT_PUBLIC_WEB_URL) ?? DEFAULT_WEB_URL);

const publicSupabase = throwIfUndefined(
  resolvePublicSupabase(),
  'Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
);

const appVersion = trimStringOptional(process.env.NEXT_PUBLIC_APP_VERSION);
const gitCommit = trimStringOptional(process.env.NEXT_PUBLIC_GIT_COMMIT);

export const env = {
  site: {
    appName: SITE_APP_NAME,
    defaultTitle: SITE_DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    webUrl,
  } satisfies SiteConfig,
  publicSupabase,
  appVersion,
  gitCommit,
};
