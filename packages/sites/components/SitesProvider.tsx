'use client';

import {ChakraProvider, createSystem, defaultConfig} from '@chakra-ui/react';
import type {ReactNode} from 'react';
import {useMemo} from 'react';
import EmotionCacheProvider from '@/components/emotion/EmotionCacheProvider';

export default function SitesProvider({children}: {children: ReactNode}) {
  const system = useMemo(() => createSystem(defaultConfig), []);
  return (
    <EmotionCacheProvider>
      <ChakraProvider value={system}>{children}</ChakraProvider>
    </EmotionCacheProvider>
  );
}
