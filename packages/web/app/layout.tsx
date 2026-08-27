import type {ReactNode} from 'react';
import type {Metadata, Viewport} from 'next';
import {Roboto} from 'next/font/google';
import Provider from './provider';
import './globals.css';
import {buildDefaultMetadata, buildWebsiteJsonLd} from '@/lib/seo/default-metadata';

const roboto = Roboto({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = buildDefaultMetadata();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#6B4F3A',
};

export default function RootLayout({children}: {children: ReactNode}) {
  const websiteJsonLd = buildWebsiteJsonLd();

  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(websiteJsonLd)}} />
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
