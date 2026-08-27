import {Box} from '@chakra-ui/react';
import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import AppHeader from '@/components/app/AppHeader';
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
      <Box bg="bg.canvas" minH="100vh">
        <AppHeader />
        {children}
      </Box>
    </PrivateRouteGuard>
  );
}
