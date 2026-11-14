import type {ReactNode} from 'react';
import type {Metadata, Viewport} from 'next';
import {isSiteAdminHost, siteSeoLocale} from '@so/model';
import {readSitesPublicEnv} from '@/lib/env';
import {loadSiteForHostCached} from '@/lib/site/loadSiteForHost';
import readRequestHost from '@/lib/site/readRequestHost';
import './globals.css';
import './admin.css';

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Site',
};

export default async function RootLayout({children}: {children: ReactNode}) {
  const host = await readRequestHost();
  const env = readSitesPublicEnv();
  if (isSiteAdminHost(host, env.rootDomain)) {
    return (
      <html lang="en-GB">
        <body>{children}</body>
      </html>
    );
  }
  const site = await loadSiteForHostCached(host);
  const lang = site === undefined ? 'en-GB' : siteSeoLocale(site.document);
  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  );
}
