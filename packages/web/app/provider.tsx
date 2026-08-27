'use client';

import {ChakraProvider} from '@chakra-ui/react';
import type {ReactNode} from 'react';
import EmotionCacheProvider from '@/components/emotion/EmotionCacheProvider';
import {soSystem} from '@/styles/so-theme';

export default function Provider({children}: {children: ReactNode}) {
  return (
    <EmotionCacheProvider>
      <ChakraProvider value={soSystem}>{children}</ChakraProvider>
    </EmotionCacheProvider>
  );
}
