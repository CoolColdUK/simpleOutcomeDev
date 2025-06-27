import {ThemeProvider} from '@/components/ThemeProvider';
import type {Metadata, Viewport} from 'next';
import {Roboto} from 'next/font/google';
import './globals.css';

const roboto = Roboto({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['latin'],
  variable: '--font-roboto',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    {media: '(prefers-color-scheme: light)', color: '#6B4F3A'},
    {media: '(prefers-color-scheme: dark)', color: '#6B4F3A'},
  ],
};

export const metadata: Metadata = {
  title: 'SimpleOutcome - Innovative Digital Solutions & Portfolio',
  description:
    'SimpleOutcome creates innovative digital solutions including CraftySmile (e-commerce management) and GoalJar (personal finance tracking). Professional portfolio showcasing web development and product design expertise.',
  keywords: [
    'SimpleOutcome',
    'portfolio',
    'web development',
    'digital solutions',
    'e-commerce management',
    'personal finance',
    'CraftySmile',
    'GoalJar',
    'software development',
    'product design',
    'React',
    'Next.js',
    'TypeScript',
  ],
  authors: [{name: 'SimpleOutcome'}],
  creator: 'SimpleOutcome',
  publisher: 'SimpleOutcome',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://simpleoutcome.dev'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'SimpleOutcome - Innovative Digital Solutions & Portfolio',
    description:
      'Professional portfolio showcasing innovative digital solutions including CraftySmile and GoalJar. Expert web development and product design services.',
    url: 'https://simpleoutcome.dev',
    siteName: 'SimpleOutcome',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SimpleOutcome Portfolio - Innovative Digital Solutions',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SimpleOutcome - Innovative Digital Solutions & Portfolio',
    description: 'Professional portfolio showcasing innovative digital solutions including CraftySmile and GoalJar.',
    images: ['/og-image.jpg'],
    creator: '@simpleoutcome',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  category: 'technology',
  classification: 'Portfolio Website',
  referrer: 'origin-when-cross-origin',
  manifest: '/manifest.json',
  icons: {
    icon: [
      {url: '/favicon.ico'},
      {url: '/icon-16x16.png', sizes: '16x16', type: 'image/png'},
      {url: '/icon-32x32.png', sizes: '32x32', type: 'image/png'},
    ],
    apple: [{url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png'}],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'SimpleOutcome',
              url: 'https://simpleoutcome.dev',
              logo: 'https://simpleoutcome.dev/logo.png',
              description: 'Innovative digital solutions and web development services',
              sameAs: ['https://twitter.com/simpleoutcome', 'https://linkedin.com/company/simpleoutcome'],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                email: 'contact@simpleoutcome.dev',
              },
            }),
          }}
        />
      </head>
      <body className={roboto.variable}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
