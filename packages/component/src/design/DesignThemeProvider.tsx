'use client';

import {ChakraProvider} from '@chakra-ui/react';
import type {DesignColourTokens} from '@so/model';
import type {ReactNode} from 'react';
import {useMemo} from 'react';
import {designChakraSystem} from './designChakraSystem';

export default function DesignThemeProvider({tokens, children}: {tokens: DesignColourTokens; children: ReactNode}) {
  const system = useMemo(() => designChakraSystem(tokens), [tokens]);
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
