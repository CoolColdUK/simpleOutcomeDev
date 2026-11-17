import {createSystem, defaultConfig, defineConfig} from '@chakra-ui/react';
import type {SiteTheme} from '@so/model';

export function siteChakraSystem(theme: SiteTheme) {
  return createSystem(
    defaultConfig,
    defineConfig({
      theme: {
        tokens: {
          colors: {
            siteBackground: {value: theme.background},
            siteForeground: {value: theme.foreground},
            siteAccent: {value: theme.accent},
            siteButtonForeground: {value: theme.buttonForeground},
            siteCard: {value: theme.cardBackground},
          },
          fonts: {
            siteHeading: {value: theme.headingFont},
            siteBody: {value: theme.bodyFont},
          },
          radii: {
            site: {value: `${theme.radiusPx}px`},
          },
        },
      },
    }),
  );
}

export function siteHeroBackground(theme: SiteTheme): string {
  return theme.heroBackground === 'none' ? 'transparent' : theme.heroBackground;
}
