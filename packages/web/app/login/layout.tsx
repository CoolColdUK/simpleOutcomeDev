import type {Metadata} from 'next';
import type {ReactNode} from 'react';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to SimpleOutcome.',
  alternates: {
    canonical: '/login',
  },
  robots: {index: false, follow: false},
};

export default function LoginLayout({children}: {children: ReactNode}) {
  return children;
}
