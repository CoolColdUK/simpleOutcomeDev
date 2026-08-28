import {Box} from '@chakra-ui/react';
import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import PrivateRouteGuard from '@/components/app/PrivateRouteGuard';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivateLayout({children}: {children: ReactNode}) {
  return (
    <PrivateRouteGuard>
      <Box>{children}</Box>
    </PrivateRouteGuard>
  );
}
