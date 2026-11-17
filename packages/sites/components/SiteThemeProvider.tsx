'use client';

import {ChakraProvider} from '@chakra-ui/react';
import type {SiteTheme} from '@so/model';
import {createContext, useContext, useMemo, type ReactNode} from 'react';
import {siteChakraSystem, siteHeroBackground} from '@/components/siteChakraSystem';

const SiteLookContext = createContext({uppercase: false, heroBackground: 'transparent'});

export function useSiteLook() {
  return useContext(SiteLookContext);
}

export default function SiteThemeProvider({theme, children}: {theme: SiteTheme; children: ReactNode}) {
  const system = useMemo(() => siteChakraSystem(theme), [theme]);
  const look = useMemo(
    () => ({uppercase: theme.uppercaseHeadings, heroBackground: siteHeroBackground(theme)}),
    [theme],
  );
  return (
    <SiteLookContext.Provider value={look}>
      <ChakraProvider value={system}>{children}</ChakraProvider>
    </SiteLookContext.Provider>
  );
}
