import type {Metadata} from 'next';
import {Roboto} from 'next/font/google';
import './globals.css';
import {ThemeProvider} from '@/components/ThemeProvider';

const roboto = Roboto({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['latin'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'SimpleOutcome - Portfolio',
  description: 'Portfolio website showcasing products and projects by SimpleOutcome',
  keywords: ['portfolio', 'web development', 'products', 'SimpleOutcome'],
  authors: [{name: 'SimpleOutcome'}],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={roboto.variable}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
