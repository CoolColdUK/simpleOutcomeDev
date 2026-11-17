import type {ReactNode} from 'react';
import type {Metadata, Viewport} from 'next';
import {isSiteAdminHost, siteSeoLocale} from '@so/model';
import {readSitesPublicEnv} from '@/lib/env';
import SitesProvider from '@/components/SitesProvider';
import {loadSiteForHostCached} from '@/lib/site/loadSiteForHost';
import readRequestHost from '@/lib/site/readRequestHost';
import './globals.css';
import './admin.css';

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const host = await readRequestHost();
  const env = readSitesPublicEnv();
  if (!isSiteAdminHost(host, env.rootDomain)) {
    return {title: 'Site'};
  }
  return {
    title: 'Site',
    icons: {
      icon: [{url: '/brand/mark.svg', type: 'image/svg+xml'}],
      apple: [{url: '/brand/apple-touch-icon.png', sizes: '180x180'}],
    },
  };
}

export default async function RootLayout({children}: {children: ReactNode}) {
  const host = await readRequestHost();
  const env = readSitesPublicEnv();
  if (isSiteAdminHost(host, env.rootDomain)) {
    return (
      <html lang="en-GB">
        <body>
          <SitesProvider>{children}</SitesProvider>
        </body>
      </html>
    );
  }
  const site = await loadSiteForHostCached(host);
  const lang = site === undefined ? 'en-GB' : siteSeoLocale(site.document);
  return (
    <html lang={lang}>
      <body>
        <SitesProvider>{children}</SitesProvider>
      </body>
    </html>
  );
}
