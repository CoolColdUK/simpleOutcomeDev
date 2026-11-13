import type {ReactNode} from 'react';
import type {Metadata, Viewport} from 'next';
import {siteSeoLocale} from '@so/model';
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
  const site = await loadSiteForHostCached(await readRequestHost());
  const lang = site === undefined ? 'en-GB' : siteSeoLocale(site.document);
  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  );
}
